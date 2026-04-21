"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Search,
  Briefcase,
  Building2,
  Users,
  MapPin,
  Globe,
  Home,
  MessageSquare,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  ArrowLeft,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Mail,
  Calendar,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/src/authStore/page";
import { useTranslations } from "next-intl";

const API_BASE = "";

export default function OrgDetailPage() {
  const t = useTranslations("orgDetail");
  const { token, user: authUser, clearSession, refreshToken } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const orgId = params?.id;

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch the specific organization by ID
  const { data: org, isLoading: orgLoading, isError: orgError } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Organization/${orgId}`, authHeaders);
      return data?.data || data;
    },
    enabled: !!token && !!orgId,
  });

  // Fetch all jobs and filter by this organization
  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Job`, authHeaders);
      return data?.data || [];
    },
    enabled: !!token,
  });

  // Filter jobs that belong to this organization
  const orgJobs = allJobs.filter((job: any) => 
    job.organizationId === Number(orgId) || job.organizationId === String(orgId)
  );

  const isLoading = orgLoading || jobsLoading;

  // Logout handler
  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await axios.post(`${API_BASE}/api/Auth/logout`, { refreshToken }, authHeaders);
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      clearSession();
      router.push("/auth/login");
    }
  };

  return (
    <div className="bg-[#0a0a0c] text-slate-200 min-h-screen font-sans selection:bg-purple-500/30">

      {/* Top navigation bar */}
      <nav className="fixed top-0 w-full bg-[#15161a]/80 backdrop-blur-md border-b border-white/5 z-50 px-4 h-14 flex items-center justify-center">
        <div className="max-w-[1128px] w-full flex items-center h-full">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/feed">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-black text-xl shadow-lg cursor-pointer hover:scale-105 transition-transform">
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
            <NavIcon icon={<Briefcase />} label={t("nav.jobs")} active href="/job" />
            <NavIcon icon={<MessageSquare />} label={t("nav.messaging")} href="/messages" />
            <NavIcon icon={<Bell />} label={t("nav.notifications")} href="/notifications" />

            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center cursor-pointer group text-slate-500 hover:text-rose-400 transition-colors p-1"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block text-[10px] mt-1 font-medium">{t("nav.logout")}</span>
            </button>

            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <Link href="/profile">
              <div className="flex flex-col items-center justify-center cursor-pointer group px-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white/10 shadow-lg">
                  {authUser?.name?.[0] || "U"}
                </div>
                <span className="text-[11px] text-slate-500 group-hover:text-white flex items-center mt-0.5">{t("nav.me")} <ChevronDown className="w-3 h-3 ml-0.5" /></span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-[1128px] mx-auto">

          {/* Back button */}
          <button
            onClick={() => router.push("/job")}
            className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">{t("backButton")}</span>
          </button>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">{t("loadingMessage")}</p>
            </div>
          )}

          {/* Error state */}
          {orgError && !isLoading && (
            <div className="bg-[#15161a] border border-red-500/20 rounded-3xl p-16 text-center shadow-2xl">
              <Sparkles size={48} className="mx-auto mb-6 text-red-500/30" />
              <h3 className="text-lg font-bold text-red-400 mb-2">{t("error.title")}</h3>
              <p className="text-sm text-slate-500 mb-6">{t("error.message")}</p>
              <button onClick={() => router.push("/job")} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-sm transition-colors">
                {t("error.button")}
              </button>
            </div>
          )}

          {/* Organization detail content */}
          {org && !isLoading && (
            <div className="space-y-8">

              {/* Organization header card */}
              <div className="bg-[#15161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                {/* Banner */}
                <div className="h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative">
                  <img
                    src={`https://picsum.photos/seed/${orgId}/1200/400`}
                    className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                    alt="banner"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#15161a] to-transparent" />
                </div>

                <div className="px-8 pb-8 -mt-16 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    {/* Logo */}
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-[#15161a] flex items-center justify-center text-4xl font-black text-purple-400 shadow-2xl shrink-0">
                      {org.name?.[0]?.toUpperCase() || "O"}
                    </div>

                    <div className="flex-1">
                      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{org.name}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {org.industry && (
                          <span className="flex items-center gap-1.5 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                            <Globe size={14} /> {org.industry}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg">
                          <MapPin size={14} className="text-pink-400" /> {org.location || t("header.global")}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                          <Briefcase size={14} /> {orgJobs.length} {t("header.openPositions", { count: orgJobs.length })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About + details grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

                {/* Left column */}
                <div className="space-y-6">

                  {/* About section */}
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2 uppercase tracking-tight">
                      <Building2 size={20} className="text-purple-400" /> {t("about.title")}
                    </h2>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {org.description || t("about.defaultDescription")}
                    </p>
                  </div>

                  {/* Open positions */}
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                      <Briefcase size={20} className="text-pink-400" /> {t("openPositions.title")}
                      <span className="text-xs bg-pink-500/20 text-pink-400 px-2.5 py-1 rounded-full ml-2">{orgJobs.length}</span>
                    </h2>

                    {orgJobs.length > 0 ? (
                      <div className="space-y-4">
                        {orgJobs.map((job: any) => (
                          <div
                            key={job.id}
                            onClick={() => router.push(`/jobDetail/${job.id}`)}
                            className="group bg-[#0a0a0c] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5 hover:border-pink-500/30 transition-all cursor-pointer hover:shadow-lg hover:shadow-pink-500/5"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-xl font-black text-pink-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                              {job.title?.[0]?.toUpperCase() || "J"}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                              <h4 className="text-lg font-bold text-slate-100 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{job.title}</h4>
                              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                  <MapPin size={12} className="text-slate-600" /> {job.location || t("jobItem.remote")}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                                  {job.jobType || t("jobItem.fullTime")}
                                </span>
                              </div>
                            </div>

                            <div className="text-right hidden md:block px-4 border-x border-white/5">
                              <div className="text-sm font-black text-slate-200">
                                ${job.salaryMin?.toLocaleString() || "80k"} - ${job.salaryMax?.toLocaleString() || "120k"}
                              </div>
                              <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{t("jobItem.annualFlux")}</div>
                            </div>

                            <div className="p-3 bg-white/5 group-hover:bg-pink-600 group-hover:text-white rounded-xl text-slate-400 transition-all">
                              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-[#0a0a0c]/40 rounded-2xl border border-white/5 border-dashed">
                        <Sparkles size={36} className="mx-auto mb-4 text-slate-700" />
                        <p className="text-sm text-slate-500 italic">{t("openPositions.empty")}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">

                  {/* Quick info card */}
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-20">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{t("sidebar.title")}</h3>

                    <div className="space-y-5">
                      {org.name && (
                        <InfoRow
                          icon={<Building2 size={18} className="text-purple-400" />}
                          label={t("sidebar.companyName")}
                          value={org.name}
                        />
                      )}
                      {org.industry && (
                        <InfoRow
                          icon={<Globe size={18} className="text-cyan-400" />}
                          label={t("sidebar.industry")}
                          value={org.industry}
                        />
                      )}
                      <InfoRow
                        icon={<MapPin size={18} className="text-pink-400" />}
                        label={t("sidebar.headquarters")}
                        value={org.location || t("sidebar.globalRemote")}
                      />
                      <InfoRow
                        icon={<Briefcase size={18} className="text-green-400" />}
                        label={t("sidebar.openPositions")}
                        value={`${orgJobs.length} ${orgJobs.length !== 1 ? t("sidebar.rolesPlural") : t("sidebar.rolesSingular")}`}
                      />
                      {org.foundedYear && (
                        <InfoRow
                          icon={<Calendar size={18} className="text-amber-400" />}
                          label={t("sidebar.founded")}
                          value={String(org.foundedYear)}
                        />
                      )}
                      {org.employeeCount && (
                        <InfoRow
                          icon={<Users size={18} className="text-blue-400" />}
                          label={t("sidebar.employees")}
                          value={org.employeeCount.toLocaleString()}
                        />
                      )}
                      {org.email && (
                        <InfoRow
                          icon={<Mail size={18} className="text-orange-400" />}
                          label={t("sidebar.contact")}
                          value={org.email}
                        />
                      )}
                    </div>

                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full mt-8 py-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-600/20 transition-all"
                      >
                        <ExternalLink size={14} /> {t("sidebar.visitWebsite")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Navigation icon
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

// Sidebar info row
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="p-2 bg-white/5 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-bold text-slate-200 mt-0.5">{value}</div>
      </div>
    </div>
  );
}