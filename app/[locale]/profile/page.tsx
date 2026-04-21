"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { 
  Plus, 
  MapPin, 
  Camera, 
  Notebook, 
  Pencil, 
  Globe, 
  Users, 
  MoreHorizontal,
  ChevronRight,
  Search,
  Home,
  Briefcase,
  MessageSquare,
  Bell,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Bookmark
} from "lucide-react";
import { useAuthStore } from "@/src/authStore/page";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/src/components/localeSwitcher";

const API_BASE = "";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { token, user: authUser } = useAuthStore();
  const queryClient = useQueryClient();

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };


  // Get the authenticated user's basic info id, email, etc.
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/User/me`, authHeaders);
      return data;
    },
    enabled: !!token, // only run if we have a token
  });

  const userId = user?.id || authUser?.id; // fallback to authUser if /me fails

  // Get the user's profile firstName, lastName, headline, photo, etc.
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/UserProfile/by-user/${userId}`, authHeaders);
      return data;
    },
    enabled: !!userId,
  });

  const profileId = userProfile?.id; // needed for profile specific endpoints

  // Work experience entries
  const { data: experiences = [] } = useQuery({
    queryKey: ["experiences", userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/UserExperience/by-user/${userId}`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!userId,
  });

  // Education entries
  const { data: education = [] } = useQuery({
    queryKey: ["education", userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/UserEducation/by-user/${userId}`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!userId,
  });

  // Skills
  const { data: skills = [] } = useQuery({
    queryKey: ["skills", userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/UserSkill/by-user/${userId}`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!userId,
  });

  // All available languages (global list)
  const { data: globalLanguages = [] } = useQuery({
    queryKey: ["allLanguages"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Language`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!token,
  });

  // Languages spoken by the user (join with globalLanguages to get names)
  const { data: profileLanguages = [] } = useQuery({
    queryKey: ["profileLanguages", profileId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/ProfileLanguage/by-profile/${profileId}`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!profileId,
  });

  // Recommendations received by the user
  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", userId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Recommendation/by-recipient/${userId}`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!userId,
  });

  // All posts  we'll filter to show only the user's own posts later
  const { data: allPosts = [] } = useQuery({
    queryKey: ["allPosts"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Post`, authHeaders);
      return data?.data || data || [];
    },
    enabled: !!token,
  });

  // Filter posts to only those created by this user
  const myPosts = allPosts.filter((p: any) => p.userId === userId);

  // Map profile languages to include the language name from global list and proficiency level
  const myLanguages = profileLanguages.map((pl: any) => {
    const lang = globalLanguages.find((l: any) => l.id === pl.languageId);
    return { name: lang?.name || "Language", level: pl.level };
  });

  // Combine firstName and lastName, fallback to user.fullName or authUser.name
  const nameValue =
    `${userProfile?.firstName || user?.firstName || ""} ${userProfile?.lastName || user?.lastName || ""}`.trim() ||
    user?.fullName ||
    authUser?.name ||
    "User";
  const initials = nameValue.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const headline = userProfile?.headline || t("defaults.headline");
  const avatar = userProfile?.photoUrl ? (userProfile.photoUrl.startsWith('http') ? userProfile.photoUrl : `${API_BASE}/uploads/${userProfile.photoUrl}`) : null;
  const location = userProfile?.location || t("defaults.location");

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
    headline: userProfile?.headline || "",
    location: userProfile?.location || "",
    aboutMe: userProfile?.aboutMe || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const payload = new FormData();
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("headline", formData.headline);
      payload.append("location", formData.location);
      payload.append("aboutMe", formData.aboutMe);

      if (selectedFile) {
        payload.append("photo", selectedFile);
      }

      return axios.put(
        `${API_BASE}/api/UserProfile/${profileId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
    },
    onSuccess: () => {
      // After successful update, refetch profile data and close the modal
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      setEditOpen(false);
    },
  });

  // Delete profile photo separately
  const deleteProfilePhoto = useMutation({
    mutationFn: async () => {
      return axios.delete(`${API_BASE}/api/UserProfile/${profileId}/photo`, authHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
  });

  // Sync form data when userProfile loads (so the edit modal shows current values)
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        headline: userProfile.headline || "",
        location: userProfile.location || "",
        aboutMe: userProfile.aboutMe || "",
      });
    }
  }, [userProfile]);

  return (
    <div className="bg-[#0a0a0c] text-slate-200 min-h-screen font-sans">
      
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

          <div className="flex items-center gap-1 sm:gap-6 h-full">
            <NavIcon icon={<Home />} label={t("nav.home")} href="/feed" />
            <NavIcon icon={<Users />} label={t("nav.network")} href="/network" />
            <NavIcon icon={<Briefcase />} label={t("nav.jobs")} href="/job" />
            <NavIcon icon={<MessageSquare />} label={t("nav.messaging")} href="/messages" />
            <NavIcon icon={<Bell />} label={t("nav.notifications")} href="/notifications" />
            <LocaleSwitcher/>
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <Link href="/profile">
              <div className="flex flex-col items-center justify-center cursor-pointer group border-b-2 border-white text-white px-2 h-full">
                {avatar ? (
                  <img src={avatar} className="w-6 h-6 rounded-full border border-white/10" alt="me" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">{initials}</div>
                )}
                <span className="text-[11px] flex items-center mt-0.5">{t("nav.me")} <ChevronDown className="w-3 h-3 ml-0.5" /></span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1128px] mx-auto pt-20 px-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 pb-20">
        
        <div className="space-y-4">
          
          <section className="bg-[#15161a] rounded-xl overflow-hidden border border-white/5 relative">
            <div className="h-48 bg-gradient-to-r from-purple-900 via-[#1a1b21] to-pink-900 relative">
               <img src="https://picsum.photos/seed/aether-banner/1200/400" className="w-full h-full object-cover opacity-60" alt="banner" />
               <button className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors">
                  <Camera size={20} className="text-white" />
               </button>
            </div>
            
            <div className="px-6 pb-6 relative">

              <div className="absolute -top-24 left-6">
                <div className="relative group">
                  {avatar ? (
                    <img src={avatar} className="w-40 h-40 rounded-full border-4 border-[#15161a] object-cover shadow-2xl" alt="profile" />
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-[#15161a] flex items-center justify-center text-5xl font-black text-white shadow-2xl">
                      {initials}
                    </div>
                  )}
                  <button className="absolute bottom-4 right-2 p-2 bg-[#1f2029] border border-white/10 rounded-full hover:bg-[#252631] transition-colors">
                    <Camera size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-20 flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-2">
                       <h1 className="text-2xl font-bold mt-15">{nameValue}</h1>
                       <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">{t("header.proBadge")}</span>
                    </div>
                    <p className="text-lg text-slate-300 mt-1">{headline}</p>
                    <div className="flex items-center gap-1 mt-2 text-slate-500 text-sm">
                       <MapPin size={14} />
                       <span>{location}</span>
                       <span className="mx-2">•</span>
                       <button className="text-purple-400 font-bold hover:underline">{t("header.contactInfo")}</button>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                       <Link href="#" className="text-purple-400 font-bold text-sm hover:underline">{t("header.connections", { count: "500+" })}</Link>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 border border-white/5 rounded-lg bg-[#1f2029]/50 shadow-inner group">
                    <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">A</div>
                    <span className="text-sm font-bold truncate max-w-[150px]">{t("header.aetherNetwork")}</span>
                 </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                 <button className="px-5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold transition-colors">
                    {t("header.openTo")}
                 </button>
                 <button className="px-5 py-1.5 border border-purple-400 text-purple-400 hover:bg-purple-400/10 rounded-full font-bold transition-all">
                    {t("header.addSection")}
                 </button>
                 <button className="px-5 py-1.5 border border-slate-500 text-slate-500 hover:bg-white/5 rounded-full font-bold transition-all">
                    {t("header.more")}
                 </button>
              </div>
            </div>
            
            {/* Edit button */}
            <button
              onClick={() => {
                setFormData({
                  firstName: userProfile?.firstName || "",
                  lastName: userProfile?.lastName || "",
                  headline: userProfile?.headline || "",
                  location: userProfile?.location || "",
                  aboutMe: userProfile?.aboutMe || "",
                });
                setEditOpen(true);
              }}
              className="absolute top-[204px] right-6 p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all"
            >
              <Pencil size={20} />
            </button>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 shadow-lg">
             <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold">{t("suggested.title")}</h2>
                <span className="text-sm text-slate-500 flex items-center gap-1">{t("suggested.privateBadge")} <Notebook size={12} /></span>
             </div>
             <p className="text-sm text-slate-500 mb-4">{t("suggested.intermediate")}</p>
             
             <div className="bg-[#0a0a0c] border border-white/10 rounded-lg p-4 flex gap-4">
                <div className="w-12 h-12 shrink-0 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded">
                   <Users size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="font-bold mb-1 border-b border-white/5 pb-1">{t("suggested.summaryTitle")}</h3>
                   <p className="text-sm text-slate-400">{t("suggested.summaryDescription")}</p>
                   <button className="mt-3 px-4 py-1 border border-white/40 rounded-full text-sm font-bold hover:bg-white/5 transition-all">{t("suggested.addSummary")}</button>
                </div>
             </div>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 border shadow-lg">
             <h2 className="text-xl font-bold mb-1">{t("analytics.title")}</h2>
             <span className="text-sm text-slate-500 flex items-center gap-1 mb-4">{t("analytics.privateBadge")} <Notebook size={12} /></span>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticsItem icon={<Users size={20}/>} count="1,240" label={t("analytics.profileViews")} trend={t("analytics.trend90days")} />
                <AnalyticsItem icon={<TrendingUp size={20}/>} count="452" label={t("analytics.postImpressions")} trend={t("analytics.trend7days")} />
                <AnalyticsItem icon={<Search size={20}/>} count="89" label={t("analytics.searchAppearances")} trend={t("analytics.trendThisWeek")} />
             </div>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 relative shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t("about.title")}</h2>
                <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all"><Pencil size={20} /></button>
             </div>
             <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {userProfile?.aboutMe || t("about.default")}
             </p>
          </section>

          <section className="bg-[#15161a] rounded-xl border border-white/5 overflow-hidden shadow-lg">
             <div className="p-6 pb-0 flex justify-between items-center">
                <div>
                   <h2 className="text-xl font-bold">{t("activity.title")}</h2>
                   <Link href="#" className="text-purple-400 font-bold text-sm hover:underline">{t("activity.followers", { count: "542" })}</Link>
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-1.5 border border-purple-400 text-purple-400 rounded-full font-bold text-sm hover:bg-purple-400/10 transition-all">{t("activity.createPost")}</button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-all"><Pencil size={20} /></button>
                </div>
             </div>
             
             <div className="p-6 space-y-4">
                {myPosts.length > 0 ? (
                  <>
                    <div className="flex gap-2 mb-4">
                       <button className="px-3 py-1 bg-green-700 text-white rounded-full text-xs font-bold font-mono shadow-md">{t("activity.postsTab")}</button>
                       <button className="px-3 py-1 border border-white/20 text-slate-400 rounded-full text-xs font-bold font-mono">{t("activity.imagesTab")}</button>
                    </div>

                    {/* Show only the 2 most recent posts – the rest are hidden behind "Show all" button */}
                    {myPosts.slice(0, 2).map((post: any) => (
                       <div key={post.id} className="pb-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors -mx-6 px-6 cursor-pointer group">
                          <p className="text-xs text-slate-500 mb-1">{nameValue} {t("activity.postedThis")} • {new Date(post.createdAt).toLocaleDateString()}</p>
                          <div className="flex gap-3">
                             {post.imageUrl && (
                                <img src={post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE}/uploads/${post.imageUrl}`} className="w-16 h-16 rounded object-cover border border-white/5 shadow-inner group-hover:scale-105 transition-transform" alt="post" />
                             )}
                             <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">{post.content}</p>
                          </div>
                          <div className="mt-2 flex gap-4 text-xs text-slate-500 font-bold font-mono">
                             <span className="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer"><TrendingUp size={12} /> {post.likesCount || 0} {t("activity.likes")}</span>
                             <span className="flex items-center gap-1 hover:text-purple-400 transition-colors cursor-pointer"><MessageSquare size={12} /> {post.commentsCount || 0} {t("activity.comments")}</span>
                          </div>
                       </div>
                    ))}
                  </>
                ) : (
                   <div className="text-center py-6 opacity-60 italic text-slate-500 text-sm">
                      {t("activity.empty")}
                   </div>
                )}
             </div>
             
             <button className="w-full text-center py-3 border-t border-white/5 text-slate-400 font-bold hover:bg-white/5 transition-colors group flex items-center justify-center gap-1 font-mono tracking-wider">
                {t("activity.showAll")} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">{t("experience.title")} <Briefcase size={18} className="text-purple-400" /></h2>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Plus size={24} /></button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Pencil size={20} /></button>
                </div>
             </div>
             
             <div className="space-y-6">
                {experiences.length > 0 ? (
                  experiences.map((exp: any, i: number) => (
                    <TimelineItem 
                      key={i}
                      logo={<Briefcase className="text-slate-500 group-hover:text-purple-400 transition-colors" />}
                      title={exp.position}
                      subtitle={exp.companyName}
                      date={`${new Date(exp.startDate).getFullYear()} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : t("experience.present")}`}
                      location="Remote Hub"
                    />
                  ))
                ) : (
                  <div className="text-center py-4 border border-dashed border-white/10 rounded-lg opacity-60 text-sm">
                    {t("experience.empty")}
                  </div>
                )}
             </div>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">{t("education.title")} <Globe size={18} className="text-purple-400" /></h2>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Plus size={24} /></button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Pencil size={20} /></button>
                </div>
             </div>
             
             <div className="space-y-6">
                {education.length > 0 ? (
                  education.map((edu: any, i: number) => (
                    <TimelineItem 
                      key={i}
                      logo={<Globe className="text-slate-500 group-hover:text-blue-400 transition-colors" />}
                      title={edu.institution}
                      subtitle={edu.degree}
                      date={`${edu.startYear} - ${edu.endYear}`}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 border border-dashed border-white/10 rounded-lg opacity-60 text-sm">
                    {t("education.empty")}
                  </div>
                )}
             </div>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t("skills.title")}</h2>
                <div className="flex gap-2">
                   <button className="px-5 py-1.5 border border-purple-400 text-purple-400 hover:bg-purple-400/10 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-purple-500/10">{t("skills.demonstrate")}</button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Plus size={24} /></button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full hover:scale-110 transition-transform"><Pencil size={20} /></button>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.length > 0 ? skills.map((s: any, i: number) => (
                   <SkillItem key={i} name={s.skillName} endorsements={s.endorsementsCount} />
                )) : (
                   <p className="text-sm text-slate-600 italic">{t("skills.empty")}</p>
                )}
             </div>
             
             <button className="w-full text-center py-3 border-t border-white/5 mt-4 text-slate-400 font-bold hover:bg-white/5 transition-colors rounded-b-xl flex items-center justify-center gap-1 group font-mono">
                {t("skills.showAll", { count: skills.length || 0 })} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 relative shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">{t("languages.title")} <Globe size={18} className="text-purple-400" /></h2>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-transform hover:scale-110"><Plus size={24} /></button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-transform hover:scale-110"><Pencil size={20} /></button>
                </div>
             </div>
             <div className="divide-y divide-white/5">
                {myLanguages.length > 0 ? myLanguages.map((l: any, i: number) => (
                   <div key={i} className="py-4 first:pt-0 last:pb-0 hover:bg-white/[0.02] transition-colors -mx-6 px-6 cursor-default group">
                      <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{l.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">{l.level}</p>
                   </div>
                )) : (
                   <p className="text-sm text-slate-600 italic">{t("languages.empty")}</p>
                )}
             </div>
          </section>

          <section className="bg-[#15161a] rounded-xl p-6 border border-white/5 shadow-inner">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">{t("recommendations.title")} <Users size={18} className="text-purple-400" /></h2>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-transform hover:scale-110"><Plus size={24} /></button>
                   <button className="p-2 text-slate-400 hover:bg-white/5 rounded-full transition-transform hover:scale-110"><Pencil size={20} /></button>
                </div>
             </div>
             {recommendations.length > 0 ? (
                <div className="space-y-6">
                   {recommendations.map((r: any, i: number) => (
                      <div key={i} className="pb-6 border-b border-white/5 last:border-0 last:pb-0 group">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
                               {r.senderName?.[0] || r.authorId?.toString()?.[0] || "R"}
                            </div>
                            <div>
                               <h4 className="font-bold text-sm text-slate-200 group-hover:text-purple-400 transition-colors">{r.senderName || t("recommendations.defaultName")}</h4>
                               <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-purple-500/20 pl-4 py-1.5 shadow-sm overflow-hidden text-ellipsis">
                            "{r.content || r.recommendationText || t("recommendations.noContent")}"
                         </p>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-8 bg-[#0a0a0c]/40 rounded-lg border border-white/5 border-dashed">
                   <p className="text-sm text-slate-600 italic mb-4">{t("recommendations.empty")}</p>
                   <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-[0.2em] font-mono">{t("recommendations.request")}</button>
                </div>
             )}
          </section>

        </div>

        <aside className="space-y-4">
        

           <div className="bg-[#15161a] rounded-xl p-4 border border-white/5 text-center shadow-lg">
              <p className="text-[11px] text-slate-500 text-right uppercase tracking-wider mb-2">{t("sidebar.adLabel")}</p>
              <p className="text-xs text-slate-400 mb-4 px-6">{t("sidebar.adMessage", { name: authUser?.name || 'Kawsar' })}</p>
              <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                    {initials}
                 </div>
              </div>
              <button className="w-full py-1.5 border border-purple-400 text-purple-400 rounded-full font-bold text-sm hover:bg-purple-400/10 transition-all shadow-lg hover:shadow-purple-500/10">
                 {t("sidebar.tryFree")}
              </button>
           </div>

           {/* Profile language and public URL settings */}
           <div className="bg-[#15161a] rounded-xl divide-y divide-white/5 border border-white/5 shadow-lg">
              <div className="p-4 flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl">
                 <div>
                    <h3 className="text-sm font-bold">{t("sidebar.profileLanguage")}</h3>
                    <p className="text-xs text-slate-500">{t("sidebar.english")}</p>
                 </div>
                 <Pencil size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4 flex justify-between items-center group cursor-pointer hover:bg-white/5 transition-colors rounded-b-xl">
                 <div>
                    <h3 className="text-sm font-bold">{t("sidebar.publicUrl")}</h3>
                    <p className="text-xs text-slate-500">aether.io/in/{userId || 'profile'}</p>
                 </div>
                 <Pencil size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
           </div>

           {/* People you may know  */}
           <div className="bg-[#15161a] rounded-xl border border-white/5 p-4 shadow-lg">
              <h2 className="text-sm font-bold mb-4">{t("sidebar.peopleAlsoViewed")}</h2>
              <div className="space-y-4">
                 <SuggestedMember name="Xavier Thorne" title="Founder @ NeuralAether" avatar="https://picsum.photos/seed/Xavier/100" />
                 <SuggestedMember name="Elena Rodriguez" title="Design Lead at Prism Labs" avatar="https://picsum.photos/seed/Elena/100" />
                 <SuggestedMember name="Marcus Miller" title="Senior Dev @ TechCloud" avatar="https://picsum.photos/seed/Marcus/100" />
              </div>
              <button className="w-full text-center text-slate-400 font-bold text-sm mt-4 pt-4 border-t border-white/5 hover:text-slate-300 transition-colors">
                 {t("sidebar.showAll")}
              </button>
           </div>
        </aside>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#15161a] w-full max-w-2xl rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-6">{t("editModal.title")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder={t("editModal.firstName")}
                className="bg-[#1f2029] p-3 rounded"
              />
              <input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder={t("editModal.lastName")}
                className="bg-[#1f2029] p-3 rounded"
              />
            </div>

            <input
              value={formData.headline}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
              placeholder={t("editModal.headline")}
              className="bg-[#1f2029] p-3 rounded w-full mt-4"
            />

            <input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder={t("editModal.location")}
              className="bg-[#1f2029] p-3 rounded w-full mt-4"
            />

            <textarea
              value={formData.aboutMe}
              onChange={(e) =>
                setFormData({ ...formData, aboutMe: e.target.value })
              }
              placeholder={t("editModal.aboutMe")}
              rows={4}
              className="bg-[#1f2029] p-3 rounded w-full mt-4"
            />

            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] || null)
                }
                className="block w-full text-sm"
              />

              {avatar && (
                <button
                  onClick={() => deleteProfilePhoto.mutate()}
                  className="px-4 py-2 bg-red-600 rounded text-white"
                >
                  {t("editModal.deletePhoto")}
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 border border-white/20 rounded"
              >
                {t("editModal.cancel")}
              </button>
              <button
                onClick={() => updateProfile.mutate()}
                className="px-4 py-2 bg-purple-600 rounded text-white"
              >
                {t("editModal.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Navigation icon – clones the passed icon to inject size and hover scale
function NavIcon({ icon, label, active = false, href = "#" }: any) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-colors border-b-2 hover:text-white group relative ${active ? "border-white text-white" : "border-transparent text-slate-500"}`}>
        <div className="relative">
          {React.cloneElement(icon, { size: 20, className: "group-hover:scale-110 transition-transform" })}
        </div>
        <span className="hidden lg:block text-[10px] mt-1 font-medium">{label}</span>
      </div>
    </Link>
  );
}

// Analytics stat card used in the analytics section
function AnalyticsItem({ icon, count, label, trend }: any) {
  return (
    <div className="flex gap-2 group cursor-pointer">
       <div className="mt-1 text-slate-400 group-hover:text-purple-400 transition-colors">{icon}</div>
       <div>
          <h4 className="font-bold flex items-center gap-1 group-hover:text-purple-400 transition-colors">{count} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></h4>
          <p className="text-xs font-bold text-slate-300">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{trend}</p>
       </div>
    </div>
  );
}

// Timeline item used for experience and education
function TimelineItem({ logo, title, subtitle, date, location, description }: any) {
  return (
    <div className="flex gap-4 group cursor-default">
       <div className="w-12 h-12 shrink-0 bg-[#0a0a0c] border border-white/5 flex items-center justify-center rounded shadow-inner group-hover:border-purple-500/20 transition-colors">
          {typeof logo === 'string' ? <img src={logo} className="w-full h-full object-contain" /> : React.cloneElement(logo, { size: 24 })}
       </div>
       <div className="flex-1 pb-6 border-b border-white/5 last:border-0 last:pb-0">
          <h3 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{title}</h3>
          <p className="text-sm text-slate-300">{subtitle}</p>
          <p className="text-xs text-slate-500 mt-1">{date} {location && `• ${location}`}</p>
          {description && <p className="text-sm text-slate-400 mt-3 leading-relaxed border-l border-white/5 pl-4">{description}</p>}
       </div>
    </div>
  );
}

// Skill item in the skills grid
function SkillItem({ name, endorsements }: any) {
  const t = useTranslations("profile");
   return (
      <div className="pb-4 border-b border-white/5 group cursor-pointer hover:bg-white/[0.02] px-2 -mx-2 rounded transition-all">
         <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{name}</h4>
         <div className="flex items-center gap-2 mt-2">
            <Users size={12} className="text-slate-500" />
            <span className="text-[11px] text-slate-400 font-medium">{endorsements} {t("skills.endorsements")}</span>
         </div>
      </div>
   );
}

// Suggested member card in the right sidebar
function SuggestedMember({ name, title, avatar }: any) {
  const t = useTranslations("profile");
   return (
      <div className="flex gap-2 group">
         <img src={avatar} className="w-12 h-12 rounded-full border border-white/5 shrink-0 group-hover:scale-110 transition-transform" alt="suggested" />
         <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-bold text-slate-200 hover:text-purple-400 transition-colors truncate cursor-pointer">{name}</h4>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">{title}</p>
            <button className="mt-2 px-3 py-1 border border-slate-500 text-slate-400 rounded-full text-xs font-bold hover:border-white hover:text-white transition-all shadow-md">
               {t("suggested.connect")}
            </button>
         </div>
         
      </div>
   );
}