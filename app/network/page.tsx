"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Search, 
  Bell, 
  Home, 
  User, 
  Briefcase, 
  Mail, 
  Users, 
  X, 
  Check, 
  MoreVertical, 
  MessageSquare, 
  UserPlus, 
  Sparkles,
  ChevronDown,
  UserCheck,
  UserMinus,
  Settings
} from 'lucide-react';
import { useAuthStore } from "@/src/authStore/page";
import { useRouter } from "next/navigation";

// Helper to fetch a user's profile by userId – used in pending requests, suggestions, and connections
const fetchProfile = async (userId: number, token: string) => {
  if (!userId || !token) return null;
  try {
    const { data } = await axios.get(`/api/Profile/by-user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (err: any) {
    // Silently fail – profile might be missing, but we don't want to break the UI
    console.log("Profile fetch failed:", userId, err?.response?.data || err.message);
    return null;
  }
};

export default function NetworkPage() {
  const { token, user: authUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6; // How many suggestions per page  client side pagination

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  //  Get the logged‑in user's full details (id, email, etc.) 
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/User/me`, authHeaders);
      return data;
    },
    enabled: !!token,
  });

  const myId = me?.id || authUser?.id; // fallback to authUser.id if /me fails

  //  Pending connection requests
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["connections-pending"],
    queryFn: async () => {
      const resp = await axios.get(`/api/Connection/pending`, authHeaders);
      return resp.data?.data || [];
    },
    enabled: !!token,
  });

  //  My current connections (both sent and received, accepted) 
  const { data: myConnections = [], isLoading: isLoadingMy } = useQuery({
    queryKey: ["connections-my"],
    queryFn: async () => {
      const resp = await axios.get(`/api/Connection/my`, authHeaders);
      return resp.data?.data || [];
    },
    enabled: !!token,
  });

  //  Directory of all users (for suggestions) 
  const { data: userDirectory = [] } = useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => {
      const resp = await axios.get(`/api/User/directory`, authHeaders);
      return resp.data?.data || [];
    },
    enabled: !!token,
  });

  //  Accept or reject a pending request ──
  const { mutate: respondToRequest } = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await axios.put(`/api/Connection/${id}/respond`, { status }, authHeaders);
    },
    onSuccess: () => {
      // Refresh both pending list and my connections list
      queryClient.invalidateQueries({ queryKey: ["connections-pending"] });
      queryClient.invalidateQueries({ queryKey: ["connections-my"] });
    }
  });

  //  Send a new connection request + automatically create a conversation 
  // Note: The backend might handle conversation creation separately, but here we do it manually.
  const { mutate: sendRequest } = useMutation({
    mutationFn: async (userId: number) => {
      // First, send the connection request
      await axios.post(`/api/Connection/send/${userId}`, {}, authHeaders);
      // Then, create or get a conversation with that user (so you can message immediately)
      const { data } = await axios.post(`/api/Conversation/create`, { otherUserId: userId }, authHeaders);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["connections-pending"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Navigate to the new conversation (if we got an id)
      const convId = data?.data?.id || data?.id || "";
      router.push(convId ? `/messages?conversationId=${convId}` : "/messages");
    },
    onError: () => {
      // Even if conversation creation fails, still go to messages (maybe fallback to empty chat)
      router.push("/messages");
    }
  });

  //  Remove an existing connection (unfriend) 
  const { mutate: removeConnection } = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/Connection/${id}`, authHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections-my"] });
    }
  });

  // ── Build the list of suggested users ──
  // Filter out:
  //  myself
  //  already connected users
  //  users with a pending request (either sent or received)
  const suggestedUsers = userDirectory.filter((u: any) => {
    if (u.id === myId) return false;
    const isConnected = myConnections.some(
      (c: any) => c.requesterId === u.id || c.addresseeId === u.id
    );
    const isPending = pendingRequests.some(
      (p: any) => p.requesterId === u.id || p.addresseeId === u.id
    );
    return !isConnected && !isPending;
  });

  // Client‑side search (by full name)
  const searchedSuggestions = suggestedUsers.filter((u: any) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client‑side pagination for suggestions
  const totalPages = Math.ceil(searchedSuggestions.length / pageSize);
  const paginatedSuggestions = searchedSuggestions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const myInitials = authUser?.name ? authUser.name.split(" ").map((n: any) => n[0]).join("").toUpperCase() : "ME";

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans flex flex-col h-screen overflow-hidden">
      
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
                placeholder="Search Aether" 
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 h-full text-slate-500">
            <NavItem icon={<Home size={22} />} label="Home" href="/feed" />
            <NavItem icon={<Users size={22} />} label="Network" active href="/network" />
            <NavItem icon={<Briefcase size={22} />} label="Jobs" />
            <NavItem icon={<MessageSquare size={22} />} label="Messaging" href="/messages" />
            <NavItem icon={<Bell size={22} />} label="Notifications" />
            
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <div className="flex flex-col items-center justify-center cursor-pointer group px-2 h-full border-b-2 border-transparent">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter text-white">
                {myInitials}
              </div>
              <span className="text-[11px] flex items-center mt-0.5 whitespace-nowrap text-slate-500 group-hover:text-white">Me <ChevronDown className="w-3 h-3 ml-0.5" /></span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 mt-14 overflow-hidden max-w-[1128px] mx-auto w-full border-x border-white/5 bg-[#0a0a0c]">
        
        <aside className="w-[300px] border-r border-white/5 hidden lg:flex flex-col shrink-0 bg-[#15161a]">
          <div className="p-4 border-b border-white/5 font-bold">
            Manage my network
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <SidebarItem icon={<Users size={18} />} label="Connections" count={myConnections.length} />
            <SidebarItem icon={<Mail size={18} />} label="Pending" count={pendingRequests.length} />
            <SidebarItem icon={<User size={18} />} label="Following" count={0} />
            <SidebarItem icon={<Briefcase size={18} />} label="Pages" count={0} />
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-4 border border-purple-500/20">
                <p className="text-xs text-slate-400 leading-relaxed italic">"The void is vast, but our network is the bridge."</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-white/5 text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
            <a href="#" className="hover:text-purple-400">About</a>
            <a href="#" className="hover:text-purple-400">Privacy</a>
            <a href="#" className="hover:text-purple-400">Terms</a>
            <span className="w-full mt-2">Aether Corp © 2026</span>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c] lg:px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* PENDING REQUESTS SECTION  only shows if there are any */}
            {pendingRequests.length > 0 && (
              <div className="bg-[#15161a] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h3 className="font-bold">Pending Invitations</h3>
                  <button className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors">Manage</button>
                </div>
                <div className="divide-y divide-white/5">
                  {pendingRequests.map((req: any) => (
                    <PendingRequestItem 
                      key={req.id} 
                      request={req} 
                      token={token} 
                      myId={myId} 
                      onAccept={() => respondToRequest({ id: req.id, status: "Accepted" })}
                      onReject={() => respondToRequest({ id: req.id, status: "Rejected" })}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#15161a] border border-white/5 rounded-xl shadow-xl p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold">Discover new visionaries</h2>
                  <p className="text-xs text-slate-500 mt-1">Based on your shared mission in the Aether void.</p>
                </div>
                <div className="relative group w-64 hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="w-full bg-[#1f2029] rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-1 ring-purple-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedSuggestions.map((user: any) => (
                  <SuggestionCard 
                    key={user.id} 
                    user={user} 
                    token={token} 
                    onConnect={() => sendRequest(user.id)} 
                  />
                ))}
                {paginatedSuggestions.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-600 italic">
                    No new members found in the immediate sector.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#15161a] border border-white/5 rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Your Flux Connections
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{myConnections.length}</span>
              </h2>
              <div className="divide-y divide-white/5">
                {myConnections.map((conn: any) => (
                  <ConnectionRow 
                    key={conn.id} 
                    connection={conn} 
                    myId={myId} 
                    token={token} 
                    onRemove={() => removeConnection(conn.id)}
                  />
                ))}
                {myConnections.length === 0 && (
                  <div className="py-8 text-center text-slate-500">
                    You haven't established any neural links yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 text-xs">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1 rounded bg-white/5 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-slate-500">Page {page} / {totalPages || 1}</span>
              <button
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1 rounded bg-white/5 disabled:opacity-30"
              >
                Next
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-10 opacity-30">
              <Sparkles size={24} className="text-purple-400 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Network Frontier Reached</p>
            </div>
          </div>
        </main>
      </div>

      {/* Global styles for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
    </div>
  );
}


// Navigation icon  clones the passed icon to inject size and hover scale
function NavItem({ icon, label, active = false, href = "#" }: any) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center justify-center p-1 px-3 cursor-pointer transition-colors border-b-2 hover:text-white group relative ${active ? "border-white text-white" : "border-transparent text-slate-500"}`}>
        <div className="relative">
          {React.cloneElement(icon, { size: 20, className: "group-hover:scale-110 transition-transform" })}
        </div>
        <span className="hidden lg:block text-[10px] mt-1 font-medium">{label}</span>
      </div>
    </Link>
  );
}

// Left sidebar item Connections, Pending, etc.
function SidebarItem({ icon, label, count }: any) {
  return (
    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-200">
        {icon}
        <span className="text-sm border-b border-transparent group-hover:border-slate-500">{label}</span>
      </div>
      <span className="text-xs font-mono text-slate-600 group-hover:text-purple-400 transition-colors">{count}</span>
    </div>
  );
}

// A pending connection request card shows who wants to connect
function PendingRequestItem({ request, token, myId, onAccept, onReject }: any) {
  // Determine the other user the one who sent the request if it's incoming, or the addressee if we sent it
  const otherUserId = request.requesterId === myId ? request.addresseeId : request.requesterId;
  const { data: profile } = useQuery({
    queryKey: ["profile", otherUserId],
    queryFn: () => fetchProfile(otherUserId, token),
    enabled: !!otherUserId && !!token,
  });

  const name = profile ? `${profile.firstName} ${profile.lastName}` : "User";
  const headline = profile?.headline || "Aether Network Member";
  const avatar = profile?.photoUrl ? (profile.photoUrl.startsWith('http') ? profile.photoUrl : `/uploads/${profile.photoUrl}`) : null;

  return (
    <div className="p-4 flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/5 shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-xs">
              {name.split(" ").map(n => n[0]).join("")}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/profile?id=${otherUserId}`} className="text-sm font-bold hover:text-purple-400 hover:underline transition-colors block truncate">{name}</Link>
          <p className="text-[11px] text-slate-500 truncate">{headline}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-400/60 font-bold uppercase tracking-wider">
            <Sparkles size={10} /> Neural Match High
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReject} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-white rounded-lg transition-colors">Ignore</button>
        <button onClick={onAccept} className="px-6 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 active:scale-95">Accept</button>
      </div>
    </div>
  );
}

// Suggestion card for Discover new visionaries grid
function SuggestionCard({ user, token, onConnect }: any) {
  const [connecting, setConnecting] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: () => fetchProfile(user.id, token),
    enabled: !!user.id && !!token,
  });

  const name = user.fullName || "Member";
  const headline = profile?.headline || "Network Visionary";
  const avatar = profile?.photoUrl ? (profile.photoUrl.startsWith('http') ? profile.photoUrl : `/uploads/${profile.photoUrl}`) : null;

  const handleConnect = () => {
    setConnecting(true);
    onConnect(); // this will trigger the mutation and navigation
  };

  return (
    <div className="bg-[#1a1b21] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group hover:bg-[#202129] transition-all relative overflow-hidden ring-1 ring-white/5 hover:ring-purple-500/30">
      <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 -z-0 opacity-50" />
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#15161a] mb-3 relative z-10 bg-slate-800">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
            {name.split(" ").map((n: any) => n[0]).join("")}
          </div>
        )}
      </div>
      <Link href={`/profile?id=${user.id}`} className="text-sm font-bold truncate w-full hover:underline">{name}</Link>
      <p className="text-[11px] text-slate-500 line-clamp-1 h-4 mb-4">{headline}</p>
      
      <button 
        onClick={handleConnect}
        disabled={connecting}
        className="w-full py-1.5 border border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connecting ? (
          <><div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" /> Connecting...</>
        ) : (
          <><UserPlus size={14} /> Connect</>
        )}
      </button>
    </div>
  );
}

// A single connection row in the "Your Flux Connections" list
function ConnectionRow({ connection, myId, token, onRemove }: any) {
  const otherUserId = connection.requesterId === myId ? connection.addresseeId : connection.requesterId;
  const { data: profile } = useQuery({
    queryKey: ["profile", otherUserId],
    queryFn: () => fetchProfile(otherUserId, token),
    enabled: !!otherUserId && !!token,
  });

  const name = profile ? `${profile.firstName} ${profile.lastName}` : "User";
  const headline = profile?.headline || "Aether Network Member";
  const avatar = profile?.photoUrl ? (profile.photoUrl.startsWith('http') ? profile.photoUrl : `/uploads/${profile.photoUrl}`) : null;

  return (
    <div className="py-4 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-[10px]">UN</div>
          )}
        </div>
        <div>
          <Link href={`/profile?id=${otherUserId}`} className="text-sm font-bold hover:text-purple-400">{name}</Link>
          <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-md">{headline}</p>
        </div>
      </div>
      {/* Actions appear on hover: message and remove */}
      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-purple-400"><MessageSquare size={16} /></button>
        <button onClick={onRemove} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-red-400"><UserMinus size={16} /></button>
      </div>
    </div>
  );
}