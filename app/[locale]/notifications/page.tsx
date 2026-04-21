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
  MoreHorizontal, 
  MessageSquare,
  Eye, 
  ShoppingBag, 
  Calendar,
  Sparkles,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { useAuthStore } from "@/src/authStore/page";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/src/components/localeSwitcher";

const API_BASE = "";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const { token, user: authUser } = useAuthStore() ;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("All"); // Not yet used for filtering  placeholder for future feature

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Get current user's details id, email, etc.
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/User/me`, authHeaders);
      return data;
    },
    enabled: !!token,
  });

  const myId = me?.id || authUser?.id; // fallback to authUser.id if /me fails

  // 2. Fetch all notifications for this user
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", myId],
    queryFn: async () => {
      const resp = await axios.get(`/api/Notification/by-user/${myId}`, authHeaders);
      return resp.data?.data || [];
    },
    enabled: !!myId && !!token,
    refetchInterval: 30000, // Poll every 30 seconds  keeps the notification bell up to date
  });


  // Mark a single notification as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: number) => {
      await axios.patch(`/api/Notification/${id}/read`, {}, authHeaders);
    },
    onSuccess: () => {
      // Invalidate the notifications query so the list updates immediately
      queryClient.invalidateQueries({ queryKey: ["notifications", myId] });
    }
  });

  // Delete a single notification
  const { mutate: deleteNotification } = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/Notification/${id}`, authHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", myId] });
    }
  });

  // "Mark all as read"  loops through all unread notifications and marks them read
  const { mutate: clearAll } = useMutation({
    mutationFn: async () => {
      for (const n of notifications) {
         if (!n.isRead) await axios.patch(`/api/Notification/${n.id}/read`, {}, authHeaders);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", myId] });
    }
  });

  const myInitials = authUser?.name ? authUser.name.split(" ").map((n:any)=>n[0]).join("").toUpperCase() : "ME";

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
                placeholder={t("nav.searchPlaceholder")} 
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 h-full text-slate-500">
            <NavItem icon={<Home size={22} />} label={t("nav.home")} href="/feed" />
            <NavItem icon={<Users size={22} />} label={t("nav.network")} href="/network" />
            <NavItem icon={<Briefcase size={22} />} label={t("nav.jobs")} href="/job" />
            <NavItem icon={<MessageSquare size={22} />} label={t("nav.messaging")} href="/messages" />
            <NavItem icon={<Bell size={22} />} label={t("nav.notifications")} active href="/notifications" />
            
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />
            <LocaleSwitcher/>
            <div className="flex flex-col items-center justify-center cursor-pointer group px-2 h-full border-b-2 border-transparent">
               <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter text-white">
                 {myInitials}
               </div>
               <span className="text-[11px] flex items-center mt-0.5 whitespace-nowrap text-slate-500 group-hover:text-white">{t("nav.me")} <ChevronDown className="w-3 h-3 ml-0.5" /></span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 mt-14 overflow-hidden max-w-[1128px] mx-auto w-full border-x border-white/5 bg-[#0a0a0c]">
        
        <aside className="w-[240px] border-r border-white/5 hidden lg:flex flex-col shrink-0 bg-[#15161a] p-4">
           <div className="bg-[#1a1b21] rounded-xl border border-white/5 p-5 text-center mb-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20">
                {myInitials}
              </div>
              <h3 className="font-bold text-sm text-white">{t("sidebar.alertControls")}</h3>
              <p className="text-[11px] text-slate-500 mt-1 mb-4 leading-relaxed">{t("sidebar.alertSubtitle")}</p>
              <button className="flex items-center justify-center gap-2 w-full py-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold hover:bg-purple-600/20 transition-all">
                <Settings size={14} /> {t("sidebar.preferences")}
              </button>
           </div>
           
           <nav className="space-y-1">
              <SidebarLink label={t("sidebar.allStreams")} active={activeTab === "All"} onClick={() => setActiveTab("All")} />
              <SidebarLink label={t("sidebar.unreadFlux")} active={activeTab === "Unread"} onClick={() => setActiveTab("Unread")} />
              <SidebarLink label={t("sidebar.neuralMentions")} active={activeTab === "Mentions"} onClick={() => setActiveTab("Mentions")} />
           </nav>

           <div className="mt-auto pt-6 text-center opacity-30">
              <Sparkles size={24} className="mx-auto text-purple-400 mb-2" />
              <p className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-400">{t("sidebar.coreVersion")}</p>
           </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c] p-4 sm:p-6 lg:p-8">
           <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                 <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t("main.title")}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{t("main.subtitle")}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    {/* Show Mark read button only if there is at least one unread notification */}
                    {notifications.some(n => !n.isRead) && (
                      <button 
                        onClick={() => clearAll()} 
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        {t("main.markRead")}
                      </button>
                    )}
                 </div>
              </div>

              <div className="space-y-3">
                 {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">{t("main.syncing")}</p>
                   </div>
                 ) : notifications.length === 0 ? (
                   // Empty state  no notifications
                   <div className="bg-[#15161a] border border-white/5 rounded-3xl p-16 text-center shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Sparkles size={56} className="mx-auto mb-6 text-purple-500/20 group-hover:scale-110 transition-transform duration-500" />
                      <h4 className="text-lg font-bold text-slate-400 mb-2">{t("empty.title")}</h4>
                      <p className="text-sm text-slate-600 max-w-[240px] mx-auto leading-relaxed italic">{t("empty.message")}</p>
                   </div>
                 ) : (
                   // Render each notification
                   notifications.map((notif: any) => (
                     <NotificationItem 
                       key={notif.id} 
                       notif={notif} 
                       onRead={() => markAsRead(notif.id)}
                       onDelete={() => deleteNotification(notif.id)}
                     />
                   ))
                 )}
              </div>
              
              {notifications.length > 3 && (
                <div className="mt-12 text-center py-10 opacity-30 select-none">
                   <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="h-px w-12 bg-white/10" />
                      <Sparkles size={20} className="text-purple-400" />
                      <div className="h-px w-12 bg-white/10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">{t("main.sequenceTerminated")}</p>
                </div>
              )}
           </div>
        </main>

        <aside className="w-[300px] border-l border-white/5 hidden xl:flex flex-col shrink-0 bg-[#0a0a0c] p-6 space-y-6">
           <div className="bg-gradient-to-br from-[#1a1b21] to-[#15161a] rounded-2xl border border-white/5 p-5 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t("rightSidebar.neuralTrends")}</h3>
              <div className="space-y-4">
                 <TrendItem label="#QuantumComputing" count="2.4k" />
                 <TrendItem label="#AetherDesign" count="1.1k" />
                 <TrendItem label="#NeuralArt" count="940" />
              </div>
              <button className="w-full mt-6 py-2 text-[11px] font-bold text-slate-500 hover:text-white transition-colors border-t border-white/5 pt-4">
                 {t("rightSidebar.viewInsights")}
              </button>
           </div>

           <div className="bg-purple-600/10 rounded-2xl border border-purple-500/20 p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                 <ShoppingBag size={48} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 relative z-10">{t("rightSidebar.jobFluxTitle")}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4 relative z-10">{t("rightSidebar.jobFluxMessage")}</p>
              <Link href="/job" className="block text-center py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-900/20 active:scale-95 transition-all">
                {t("rightSidebar.exploreVentures")}
              </Link>
           </div>
        </aside>
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
      <div className={`flex flex-col items-center justify-center p-1 px-3 cursor-pointer transition-colors border-b-2 hover:text-white group relative h-full ${active ? "border-white text-white" : "border-transparent text-slate-500"}`}>
        <div className="relative">
          {React.cloneElement(icon, { size: 20, className: "group-hover:scale-110 transition-transform duration-300" })}
        </div>
        <span className="hidden lg:block text-[10px] mt-1 font-medium tracking-wide">{label}</span>
      </div>
    </Link>
  );
}

// Sidebar filter link  currently only visual, no actual filtering implemented
function SidebarLink({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${active ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-inner" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
    >
      {label}
    </button>
  );
}

// A trending topic item in the right sidebar
function TrendItem({ label, count }: any) {
  const t = useTranslations("notifications");
  return (
    <div className="group cursor-pointer">
       <h4 className="text-[13px] font-bold text-slate-300 group-hover:text-purple-400 transition-colors">{label}</h4>
       <p className="text-[10px] text-slate-600 font-medium">{count} {t("trendItem.visionariesDiscussing")}</p>
    </div>
  );
}

// A single notification card  shows icon, title, message, time, and hover actions
function NotificationItem({ notif, onRead, onDelete }: any) {
  const t = useTranslations("notifications");
  // Map notification type to a specific icon
  const getIcon = (type: string) => {
    switch (type) {
      case "JobMatched": return <ShoppingBag className="text-pink-400 drop-shadow-glow-pink" size={18} />;
      case "ConnectionRequested": return <Users className="text-purple-400 drop-shadow-glow-purple" size={18} />;
      case "PostLiked": return <Sparkles className="text-blue-400 drop-shadow-glow-blue" size={18} />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className={`group relative p-5 bg-[#15161a] border border-white/5 rounded-3xl flex items-start gap-5 transition-all duration-500 hover:bg-[#1a1b21] hover:border-white/10 hover:shadow-2xl hover:-translate-y-0.5 ${!notif.isRead ? "ring-1 ring-purple-500/30 bg-[#1a1b21]/50" : ""}`}>
       {/* Unread indicator  pulsing purple dot */}
       {!notif.isRead && (
         <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse" />
       )}
       
       <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner group-hover:rotate-3 transition-transform">
          {getIcon(notif.type)}
       </div>

       <div className="flex-1 min-w-0 pr-12">
          <h4 className="text-[14px] font-bold text-white mb-1.5 leading-snug group-hover:text-purple-300 transition-colors">{notif.title}</h4>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-4 line-clamp-2 italic">{notif.message}</p>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
             <span className="flex items-center gap-1.5">
               <Calendar size={10} />
               {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
             </span>
             {!notif.isRead && <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 shadow-purple-500/20">{t("notification.activePulse")}</span>}
          </div>
       </div>

       <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
          <button onClick={onRead} title={t("notification.markAsRead")} className="p-2.5 bg-[#0a0a0c] hover:bg-green-500/10 rounded-xl text-slate-600 hover:text-green-400 transition-all border border-white/5 active:scale-90 shadow-lg">
            <CheckCircle2 size={16} />
          </button>
          <button onClick={onDelete} title={t("notification.delete")} className="p-2.5 bg-[#0a0a0c] hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-400 transition-all border border-white/5 active:scale-90 shadow-lg">
            <Trash2 size={16} />
          </button>
       </div>
    </div>
  );
}