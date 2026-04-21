"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Edit,
  MoreHorizontal,
  Video,
  Phone,
  Info,
  Plus,
  Smile,
  Image as ImageIcon,
  Send,
  CheckCheck,
  ChevronDown,
  Home,
  Users,
  Briefcase,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import { useAuthStore } from "@/src/authStore/page";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/src/components/localeSwitcher";

const API_BASE = "";


// Fetch a user's profile by userId – used repeatedly in conversation items & headers
const fetchProfile = async (userId: number, token: string) => {
  if (!userId || !token) return null;
  try {
    const { data } = await axios.get(`/api/UserProfile/by-user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data?.data || data;
  } catch {
    return null; // Silently fail – profile might be missing
  }
};

// Turn a photoUrl into a full image URL (supports both absolute and relative paths)
const getAvatarUrl = (photoUrl?: string) => {
  if (!photoUrl) return null;
  return photoUrl.startsWith("http") ? photoUrl : `/uploads/${photoUrl}`;
};

// Simple time formatter: "14:30"
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Simple date formatter: "Apr 15"
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });


// A toast notification – appears at bottom right, auto‑dismisses after 4 seconds
type Toast = { id: number; message: string; type: "error" | "success" };

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const t = useTranslations("messaging");
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((tObj) => (
        <div
          key={tObj.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium pointer-events-auto transition-all animate-fade-in
            ${tObj.type === "error"
              ? "bg-red-950 border-red-500/30 text-red-300"
              : "bg-green-950 border-green-500/30 text-green-300"
            }`}
        >
          <AlertCircle size={15} />
          {tObj.message}
          <button onClick={() => onDismiss(tObj.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Custom hook to manage toasts – increments a counter to give each toast a unique id
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: "error" | "success" = "error") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismiss };
}

// ─── Emoji Picker ────────────────────────────────────────────────────────────

// A list of commonly used emojis – quick picker for chat
const EMOJI_LIST = [
  "😀","😂","😊","😍","🤔","😢","😡","👍","👎","❤️","🔥","✨","🎉","🙌","👏",
  "💯","🤣","😅","😎","🥰","😇","🤩","😴","🤯","😤","😭","😱","🥳","🤝","💪",
  "🙏","✌️","🫡","💬","📩","🚀","🌟","💡","📌","🎯","✅","❌","⚡","💎","🔮",
];

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  // Click outside detection: close the picker if user clicks anywhere outside it
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-14 left-2 bg-[#1a1b22] border border-white/10 rounded-2xl p-3 shadow-2xl z-50 w-72"
    >
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_LIST.map((em) => (
          <button
            key={em}
            onClick={() => onSelect(em)}
            className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors leading-none"
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

// Modal that lets you search for a user and start a new DM conversation
function NewConversationModal({
  token,
  myId,
  onClose,
  onCreated,
}: {
  token: string;
  myId: number;
  onClose: () => void;
  onCreated: (conversationId: number) => void;
}) {
  const t = useTranslations("messaging");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch all users from directory, then filter client‑side by search term
  // (Not ideal for large user bases, but works for demo/early stage)
  const { data: users = [], isFetching } = useQuery({
    queryKey: ["userSearch", search],
    queryFn: async () => {
      if (search.trim().length < 2) return [];
      const { data } = await axios.get(`/api/User/directory`, authHeaders);
      const allUsers = data?.data || data || [];
      return allUsers.filter((u: any) => {
        if (u.id === myId) return false;
        const name = (u.fullName || u.userName || u.email || "").toLowerCase();
        return name.includes(search.toLowerCase());
      });
    },
    enabled: search.trim().length >= 2,
  });

  // Create conversation – calls POST /api/Conversation with the other user's id
  const { mutate: createConversation, isPending } = useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await axios.post(`/api/Conversation`, { otherUserId: userId }, authHeaders);
      return data?.data || data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onCreated(data?.id || data?.data?.id);
      onClose();
    },
    onError: () => addToast(t("newConv.error"), "error"),
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#15161a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-base font-bold">{t("newConv.title")}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              type="text"
              placeholder={t("newConv.searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
              className="w-full bg-[#1f2029] rounded-xl h-10 pl-10 pr-4 text-sm outline-none border border-transparent focus:border-purple-500/40 text-slate-200"
            />
            {isFetching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 animate-spin" />
            )}
          </div>

          {search.trim().length < 2 && (
            <p className="text-xs text-slate-500 text-center py-4">{t("newConv.minChars")}</p>
          )}

          {search.trim().length >= 2 && !isFetching && users.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">{t("newConv.noUsers", { search })}</p>
          )}

          <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
            {users.map((u: any) => {
              const name = (u.fullName || u.userName || u.email || "User").trim();
              const avatar = getAvatarUrl(u.photoUrl);
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const isSelected = selectedUser?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(isSelected ? null : u)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected ? "bg-purple-500/20 border border-purple-500/30" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  {isSelected && <div className="ml-auto w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            disabled={!selectedUser || isPending}
            onClick={() => selectedUser && createConversation(selectedUser.id)}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isPending ? t("newConv.starting") : t("newConv.start")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function MessagingPage() {
  const t = useTranslations("messaging");
  const { token, user: authUser } = useAuthStore();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toasts, addToast, dismiss } = useToast();

  // Local UI state
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/User/me`, authHeaders);
      return data?.data || data;
    },
    enabled: !!token,
  });

  const myId = me?.id || authUser?.id; // fallback to authUser if /me fails

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axios.get(`/api/Conversation`, authHeaders);
      return response.data?.data || [];
    },
    enabled: !!token,
    refetchInterval: 5000, // Poll every 5 seconds to catch new messages / unread counts
  });

  const filteredConversations = conversations.filter((c: any) => {
    if (!conversationSearch.trim()) return true;
    const preview = (c.lastMessagePreview || "").toLowerCase();
    return preview.includes(conversationSearch.toLowerCase());
  });

  // URL param sync: if ?conversationId=123 is present, select that conversation
  useEffect(() => {
    const id = searchParams.get("conversationId");
    if (id) setSelectedConversationId(Number(id));
  }, [searchParams]);

  // Auto‑select the first conversation if none is selected and we have conversations
  useEffect(() => {
    const id = searchParams.get("conversationId");
    if (!id && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations]);

  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId);

  //  Messages for the selected conversation 
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/Message/by-conversation/${selectedConversationId}`,
        authHeaders
      );
      return response.data?.data || [];
    },
    enabled: !!selectedConversationId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Send a new message (text + optional file) 
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File | null }) => {
      if (file) {
        // If there's a file, use multipart/form-data
        const form = new FormData();
        form.append("conversationId", String(selectedConversationId));
        form.append("content", content || "");
        form.append("file", file);
        return await axios.post(`/api/Message`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      // Otherwise just send JSON
      return await axios.post(
        `/api/Message`,
        { conversationId: selectedConversationId, content },
        authHeaders
      );
    },
    onSuccess: () => {
      // Clear the input, file, and typing indicator after successful send
      setMessageText("");
      setAttachedFile(null);
      setIsTyping(false);
      // Invalidate both messages list and conversations list (for last message preview & unread counts)
      queryClient.invalidateQueries({ queryKey: ["messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => addToast(t("sendError"), "error"),
  });

  //  Auto‑scroll to bottom when new messages arrive 
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  //  Auto‑resize the textarea based on content (max height 120px) 
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [messageText]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = messageText.trim();
    if ((!text && !attachedFile) || isSending) return;
    sendMessage({ content: text, file: attachedFile });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    setIsTyping(true);
    // Reset typing indicator after 1.5 seconds of no input
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 1500);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast(t("fileTooLarge"), "error");
      return;
    }
    setAttachedFile(file);
  };

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
    router.push(`/messages?conversationId=${id}`, { scroll: false });
  };

  const handleConversationCreated = (id: number) => {
    handleSelectConversation(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans flex flex-col h-screen overflow-hidden">
      {/*  Nav  */}
      <nav className="fixed top-0 w-full bg-[#15161a] border-b border-white/5 z-50 px-4 h-14 flex items-center justify-center">
        <div className="max-w-[1128px] w-full flex items-center h-full">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/feed">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20 cursor-pointer">
                A
              </div>
            </Link>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder={t("nav.searchPlaceholder")}
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 h-full text-slate-500">
            <NavItem icon={<Home size={22} />} label={t("nav.home")} href="/feed" />
            <NavItem icon={<Users size={22} />} label={t("nav.network")} href="/network" />
            <NavItem icon={<Briefcase size={22} />} label={t("nav.jobs")} href="/job" />
            <NavItem icon={<MessageSquare size={22} />} label={t("nav.messaging")} active href="/messages" />
            <NavItem icon={<Bell size={22} />} label={t("nav.notifications")} href="/notifications" />
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />
             <LocaleSwitcher/>
            <div className="flex flex-col items-center justify-center cursor-pointer group">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                ME
              </div>
              <span className="text-[11px] flex items-center mt-0.5">
                {t("nav.me")} <ChevronDown className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 mt-14 overflow-hidden max-w-[1128px] mx-auto w-full border-x border-white/5 bg-[#15161a]">
        {/*  Sidebar (conversation list)  */}
        <aside className="w-[380px] border-r border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("sidebar.title")}</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <MoreHorizontal size={20} />
              </button>
              <button
                onClick={() => setShowNewConvModal(true)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-purple-400 hover:text-purple-300"
                title={t("sidebar.newConversation")}
              >
                <Edit size={20} />
              </button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={t("sidebar.searchPlaceholder")}
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                className="w-full bg-[#1f2029] rounded h-9 pl-10 pr-4 text-sm outline-none border border-transparent focus:border-purple-500/30"
              />
              {conversationSearch && (
                <button
                  onClick={() => setConversationSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {isLoadingConversations ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {conversationSearch
                  ? t("sidebar.noResults", { query: conversationSearch })
                  : t("sidebar.empty")}
              </div>
            ) : (
              filteredConversations.map((conv: any) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  myId={myId}
                  token={token}
                  isActive={selectedConversationId === conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#050505] min-w-0">
          {selectedConversationId ? (
            <>
              <ChatHeader
                conversationId={selectedConversationId}
                myId={myId}
                token={token}
                conversations={conversations}
                onVideoCall={() => addToast(t("comingSoon"), "success")}
                onVoiceCall={() => addToast(t("comingSoon"), "success")}
              />

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent"
              >
                {isLoadingMessages ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
                    <MessageSquare size={48} strokeWidth={1} />
                    <p className="text-sm">{t("chat.empty")}</p>
                  </div>
                ) : (
                  messages.map((msg: any, idx: number) => {
                    const prevMsg = messages[idx - 1];
                    // Show a date separator if this message is on a different day than the previous one
                    const showDateSep =
                      !prevMsg ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(prevMsg.createdAt).toDateString();
                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSep && (
                          <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                              {new Date(msg.createdAt).toLocaleDateString([], {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>
                        )}
                        <MessageBubble message={msg} isMe={msg.senderId === myId} />
                      </React.Fragment>
                    );
                  })
                )}

                {/* Typing indicator  shown when the other user is typing  */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1f2029] border border-white/5 px-4 py-2.5 rounded-2xl rounded-bl-none flex gap-1 items-center">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/*  Attached file preview  */}
              {attachedFile && (
                <div className="px-4 pt-2">
                  <div className="flex items-center gap-2 bg-[#1f2029] rounded-xl px-3 py-2 border border-purple-500/20 text-sm">
                    <Paperclip size={14} className="text-purple-400" />
                    <span className="flex-1 truncate text-slate-300">{attachedFile.name}</span>
                    <span className="text-xs text-slate-500">
                      {(attachedFile.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/*  Message composer  */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-white/5 bg-[#0a0a0c] relative"
              >
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-[#1f2029] rounded-2xl p-2 pb-1 border border-white/5 focus-within:border-purple-500/30 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t("composer.placeholder")}
                      rows={1}
                      className="w-full bg-transparent border-none outline-none resize-none text-[13px] px-2 py-1 text-slate-200 placeholder-slate-600 max-h-[120px] overflow-y-auto custom-scrollbar"
                    />
                    <div className="flex items-center justify-between px-1 border-t border-white/5 mt-1 pt-1">
                      <div className="flex gap-1">
                        <AttachmentIcon
                          icon={<Plus size={16} />}
                          title={t("composer.attachFile")}
                          onClick={() => fileInputRef.current?.click()}
                        />
                        <AttachmentIcon
                          icon={<ImageIcon size={16} />}
                          title={t("composer.attachImage")}
                          onClick={() => fileInputRef.current?.click()}
                        />
                        <AttachmentIcon
                          icon={<Smile size={16} />}
                          title={t("composer.emoji")}
                          onClick={() => setShowEmojiPicker((v) => !v)}
                          active={showEmojiPicker}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {messageText.length > 200 && (
                          <span
                            className={`text-[10px] font-mono ${
                              messageText.length > 500 ? "text-red-400" : "text-slate-500"
                            }`}
                          >
                            {messageText.length}/500
                          </span>
                        )}
                        <button
                          type="submit"
                          disabled={(!messageText.trim() && !attachedFile) || isSending}
                          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-full p-1.5 transition-all shadow-lg shadow-purple-500/20 disabled:cursor-not-allowed"
                        >
                          {isSending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                />
              </form>
            </>
          ) : (
            // Empty state  no conversation selected
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("emptyState.title")}</h3>
              <p className="max-w-xs text-sm leading-relaxed">
                {t("emptyState.description")}{" "}
                <button
                  onClick={() => setShowNewConvModal(true)}
                  className="text-purple-400 hover:underline"
                >
                  {t("emptyState.startNew")}
                </button>
              </p>
            </div>
          )}
        </main>

        <aside className="w-[300px] hidden xl:block p-4 space-y-4">
          <div className="bg-[#1a1b21] rounded-xl border border-white/5 p-4 text-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">
              {t("rightSidebar.title")}
            </p>
            <div className="flex justify-center -space-x-3 mb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-[#15161a] bg-slate-800 flex items-center justify-center text-xs font-bold ring-1 ring-white/5"
                >
                  {String.fromCharCode(64 + i)} {/*a clever trick to generate uppercase letters A, B, C, … based on the loop index i.*/}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#15161a] bg-purple-600 flex items-center justify-center text-xs font-bold">
                +5
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4 px-2">
              {t("rightSidebar.description")}
            </p>
            <button className="w-full py-1.5 border border-purple-400 text-purple-400 hover:bg-purple-400/10 rounded-full text-xs font-bold transition-all">
              {t("rightSidebar.tryFree")}
            </button>
          </div>

          <div className="text-[11px] text-gray-600 font-bold px-4 space-y-1">
            <div className="flex justify-center gap-3">
              <a href="#" className="hover:text-purple-400">{t("footer.about")}</a>
              <a href="#" className="hover:text-purple-400">{t("footer.helpCenter")}</a>
              <a href="#" className="hover:text-purple-400">{t("footer.privacy")}</a>
            </div>
            <p className="text-center">{t("footer.copyright")}</p>
          </div>
        </aside>
      </div>

      {showNewConvModal && myId && (
        <NewConversationModal
          token={token!}
          myId={myId}
          onClose={() => setShowNewConvModal(false)}
          onCreated={handleConversationCreated}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Global styles for custom scrollbar and fade-in animation */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>
    </div>
  );
}


// Navigation icon – clones the passed icon to inject size and hover scale
function NavItem({ icon, label, active = false, href = "#" }: any) {
  return (
    <Link href={href}>
      <div
        className={`flex flex-col items-center justify-center p-1 px-3 h-full cursor-pointer transition-colors border-b-2 hover:text-white group ${
          active ? "border-white text-white" : "border-transparent text-slate-500"
        }`}
      >
        <div className="relative">
          {React.cloneElement(icon, {
            size: 20,
            className: "group-hover:scale-110 transition-transform",
          })}
        </div>
        <span className="hidden lg:block text-[10px] mt-1 font-medium">{label}</span>
      </div>
    </Link>
  );
}

// A single conversation item in the sidebar – shows avatar, name, last message, unread badge
function ConversationItem({ conversation, myId, token, isActive, onClick }: any) {
  const t = useTranslations("messaging");
  const otherUserId =
    conversation.user1Id === myId ? conversation.user2Id : conversation.user1Id;

  // Fetch the other user's profile to display name and avatar
  const { data: otherUser } = useQuery({
    queryKey: ["profile", otherUserId],
    queryFn: () => fetchProfile(otherUserId, token),
    enabled: !!otherUserId && !!token,
  });

  const name = otherUser
    ? (otherUser.fullName || `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || "User")
    : "User";
  const avatar = getAvatarUrl(otherUser?.photoUrl);
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasUnread = !isActive && conversation.unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all border-l-4 hover:bg-white/[0.03] ${
        isActive
          ? "bg-purple-500/10 border-purple-500 shadow-[inset_4px_0_10px_rgba(139,92,246,0.1)]"
          : "border-transparent"
      }`}
    >
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            className="w-12 h-12 rounded-full object-cover border border-white/10"
            alt={name}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#15161a]" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h4
            className={`text-sm font-bold truncate ${
              isActive ? "text-white" : "text-slate-300"
            }`}
          >
            {name}
          </h4>
          <span className="text-[10px] text-slate-500 shrink-0">
            {conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs text-slate-500 truncate leading-tight mt-0.5 flex-1">
            {conversation.lastMessagePreview || t("conversation.noMessages")}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[18px] h-[18px] bg-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Header of the chat area  shows other user's name, headline, and call/info buttons
function ChatHeader({ conversationId, myId, token, conversations, onVideoCall, onVoiceCall }: any) {
  const t = useTranslations("messaging");
  const conversation = conversations.find((c: any) => c.id === conversationId);
  const otherUserId =
    conversation?.user1Id === myId ? conversation?.user2Id : conversation?.user1Id;

  const { data: otherUser } = useQuery({
    queryKey: ["profile", otherUserId],
    queryFn: () => fetchProfile(otherUserId, token),
    enabled: !!otherUserId && !!token,
  });

  const name = otherUser ? (otherUser.fullName || `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || "User") : "User";
  const avatar = getAvatarUrl(otherUser?.photoUrl);
  const headline = otherUser?.headline || otherUser?.aboutMe || t("chat.defaultHeadline");

  return (
    <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#0a0a0c]/80 backdrop-blur-md z-10 sticky top-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">
              {name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <h3 className="text-sm font-bold text-white tracking-wide truncate">{name}</h3>
          <p className="text-[10px] text-slate-500 truncate">{headline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <button
          onClick={onVideoCall}
          className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-all"
          title={t("chat.videoCall")}
        >
          <Video size={18} />
        </button>
        <button
          onClick={onVoiceCall}
          className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-all"
          title={t("chat.voiceCall")}
        >
          <Phone size={18} />
        </button>
        <button
          className="p-2 hover:text-white hover:bg-white/5 rounded-full transition-all"
          title={t("chat.info")}
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
}

// A single message bubble  styled differently for "me" vs "them"
function MessageBubble({ message, isMe }: any) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] space-y-1 ${
          isMe ? "items-end" : "items-start"
        } flex flex-col`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
            isMe
              ? "bg-gradient-to-br from-purple-800/80 to-purple-900/80 border border-purple-500/20 text-slate-100 rounded-br-none"
              : "bg-[#1f2029] border border-white/5 text-slate-200 rounded-bl-none"
          }`}
        >
          {message.content && <span>{message.content}</span>}
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            {formatTime(message.createdAt)}
          </span>
          {isMe && (
            <CheckCheck
              size={10}
              className="text-purple-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Small button in the composer for attaching files / emojis
function AttachmentIcon({
  icon,
  title,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-full transition-all ${
        active
          ? "text-purple-400 bg-purple-500/10"
          : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
      }`}
    >
      {icon}
    </button>
  );
}