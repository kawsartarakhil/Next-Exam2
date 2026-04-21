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
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  Send,
  Bookmark,
  Share2,
  ExternalLink,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/src/authStore/page";

// API base – empty means relative URLs, works when backend is on same origin
const API_BASE = "";

export default function JobDetailPage() {
  // pulling auth state (token + user info) from global store
  const { token, user: authUser, clearSession, refreshToken } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id;

  // reusable headers for authenticated API calls
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch the specific job by ID
  const { data: job, isLoading, isError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Job/${jobId}`, authHeaders);
      return data?.data || data;
    },
    enabled: !!token && !!jobId,
  });

  // Fetch the organization that posted the job (if the job has an organizationId)
  const { data: organization } = useQuery({
    queryKey: ["organization", job?.organizationId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE}/api/Organization/${job.organizationId}`, authHeaders);
      return data?.data || data;
    },
    enabled: !!token && !!job?.organizationId,
  });

  // logout user: call backend (if refresh token exists), then clear local session
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

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format salary helper
  const formatSalary = (min: number, max: number) => {
    const fmtMin = min ? `$${min.toLocaleString()}` : null;
    const fmtMax = max ? `$${max.toLocaleString()}` : null;
    if (fmtMin && fmtMax) return `${fmtMin} – ${fmtMax}`;
    if (fmtMin) return `From ${fmtMin}`;
    if (fmtMax) return `Up to ${fmtMax}`;
    return "Competitive";
  };

  return (
    <div className="bg-[#0a0a0c] text-slate-200 min-h-screen font-sans selection:bg-purple-500/30">

      {/* Top navigation bar */}
      <nav className="fixed top-0 w-full bg-[#15161a]/80 backdrop-blur-md border-b border-white/5 z-50 px-4 h-14 flex items-center justify-center">
        <div className="max-w-[1128px] w-full flex items-center h-full">

          {/* Logo + search input */}
          <div className="flex items-center gap-2 flex-1">
            <Link href="/feed">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-black text-xl shadow-lg cursor-pointer hover:scale-105 transition-transform">
                A
              </div>
            </Link>

            {/* Search (hidden on mobile) */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder="Find opportunities..."
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium text-slate-200"
              />
            </div>
          </div>

          {/* Navigation icons */}
          <div className="flex items-center gap-1 sm:gap-6 h-full">
            <NavIcon icon={<Home />} label="Home" href="/feed" />
            <NavIcon icon={<Users />} label="Network" href="/network" />
            <NavIcon icon={<Briefcase />} label="Jobs" active href="/job" />
            <NavIcon icon={<MessageSquare />} label="Messaging" href="/messages" />
            <NavIcon icon={<Bell />} label="Notifications" href="/notifications" />

            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            {/* logout button */}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center cursor-pointer group text-slate-500 hover:text-rose-400 transition-colors p-1"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block text-[10px] mt-1 font-medium">Logout</span>
            </button>

            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            {/* user avatar */}
            <Link href="/profile">
              <div className="flex flex-col items-center justify-center cursor-pointer group px-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white/10 shadow-lg">
                  {authUser?.name?.[0] || "U"}
                </div>
                <span className="text-[11px] text-slate-500 group-hover:text-white flex items-center mt-0.5">Me <ChevronDown className="w-3 h-3 ml-0.5" /></span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-[1128px] mx-auto">

          {/* Back button */}
          <button
            onClick={() => router.push("/job")}
            className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Jobs</span>
          </button>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-purple-500/20" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading transmission data...</p>
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="bg-[#15161a] border border-red-500/20 rounded-3xl p-16 text-center shadow-2xl">
              <Sparkles size={48} className="mx-auto mb-6 text-red-500/30" />
              <h3 className="text-lg font-bold text-red-400 mb-2">Transmission Failed</h3>
              <p className="text-sm text-slate-500 mb-6">Unable to decode the job signal from the Aether network.</p>
              <button onClick={() => router.push("/job")} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-sm transition-colors">
                Return to Jobs Hub
              </button>
            </div>
          )}

          {/* Job detail content */}
          {job && !isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

              {/* Left column – main job info */}
              <div className="space-y-6">

                {/* Job header card */}
                <div className="bg-[#15161a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Gradient banner */}
                  <div className="h-36 bg-gradient-to-r from-purple-900 via-pink-900/50 to-indigo-900 relative">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/jobbanner/1200/400')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#15161a] to-transparent" />
                  </div>

                  <div className="px-8 pb-8 -mt-12 relative z-10">
                    {/* Job icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-[#15161a] flex items-center justify-center text-3xl font-black text-white shadow-2xl mb-5">
                      {job.title?.[0]?.toUpperCase() || "J"}
                    </div>

                    {/* Title and meta */}
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">{job.title}</h1>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      {organization && (
                        <span className="flex items-center gap-1.5 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                          <Building2 size={14} /> {organization.name}
                        </span>
                      )}
                      {!organization && job.organizationId && (
                        <span className="flex items-center gap-1.5 text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                          <Building2 size={14} /> Aether Network
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg">
                        <MapPin size={14} className="text-pink-400" /> {job.location || "Remote"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-black text-pink-400 uppercase tracking-widest bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                        <Briefcase size={14} /> {job.jobType || "Full-Time"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 mt-6">
                      <button className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20 text-sm">
                        <Send size={16} /> Apply Now
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-xl transition-all text-sm border border-white/5">
                        <Bookmark size={16} /> Save
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-xl transition-all text-sm border border-white/5">
                        <Share2 size={16} /> Share
                      </button>
                    </div>
                  </div>
                </div>

                {/* Job description */}
                <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                  <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2 uppercase tracking-tight">
                    <Sparkles size={20} className="text-purple-400" /> Job Description
                  </h2>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {job.description || "No detailed description has been provided for this position yet. Contact the organization for more information."}
                  </div>
                </div>

                {/* Requirements */}
                {job.requirements && (
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2 uppercase tracking-tight">
                      <CheckCircle2 size={20} className="text-green-400" /> Requirements
                    </h2>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.requirements}
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {job.responsibilities && (
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2 uppercase tracking-tight">
                      <Briefcase size={20} className="text-blue-400" /> Responsibilities
                    </h2>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.responsibilities}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && (
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2 uppercase tracking-tight">
                      <Globe size={20} className="text-cyan-400" /> Benefits
                    </h2>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.benefits}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column – sidebar with key details */}
              <div className="space-y-6">

                {/* Key details card */}
                <div className="bg-[#15161a] border border-white/5 rounded-3xl p-6 shadow-xl sticky top-20">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Transmission Details</h3>

                  <div className="space-y-5">
                    {/* Salary */}
                    <DetailRow
                      icon={<DollarSign size={18} className="text-green-400" />}
                      label="Salary Range"
                      value={formatSalary(job.salaryMin, job.salaryMax)}
                    />

                    {/* Job type */}
                    <DetailRow
                      icon={<Briefcase size={18} className="text-purple-400" />}
                      label="Employment Type"
                      value={job.jobType || "Full-Time"}
                    />

                    {/* Location */}
                    <DetailRow
                      icon={<MapPin size={18} className="text-pink-400" />}
                      label="Location"
                      value={job.location || "Remote"}
                    />

                    {/* Experience level */}
                    {job.experienceLevel && (
                      <DetailRow
                        icon={<Users size={18} className="text-blue-400" />}
                        label="Experience Level"
                        value={job.experienceLevel}
                      />
                    )}

                    {/* Category / Industry */}
                    {job.category && (
                      <DetailRow
                        icon={<Globe size={18} className="text-cyan-400" />}
                        label="Category"
                        value={job.category}
                      />
                    )}

                    {/* Posted date */}
                    <DetailRow
                      icon={<Calendar size={18} className="text-amber-400" />}
                      label="Posted On"
                      value={formatDate(job.createdAt || job.postedAt)}
                    />

                    {/* Deadline */}
                    {(job.deadline || job.expiresAt || job.closingDate) && (
                      <DetailRow
                        icon={<Clock size={18} className="text-red-400" />}
                        label="Application Deadline"
                        value={formatDate(job.deadline || job.expiresAt || job.closingDate)}
                      />
                    )}

                    {/* Is Active */}
                    {job.isActive !== undefined && (
                      <DetailRow
                        icon={<CheckCircle2 size={18} className={job.isActive ? "text-green-400" : "text-red-400"} />}
                        label="Status"
                        value={job.isActive ? "Actively Hiring" : "Closed"}
                      />
                    )}
                  </div>

                  {/* Apply button */}
                  <button className="w-full mt-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20 text-sm flex items-center justify-center gap-2">
                    <Send size={16} /> Apply for this Role
                  </button>
                </div>

                {/* Organization card */}
                {organization && (
                  <div className="bg-[#15161a] border border-white/5 rounded-3xl p-6 shadow-xl group">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5">About the Organization</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-2xl font-black text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
                        {organization.name?.[0]?.toUpperCase() || "O"}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">{organization.name}</h4>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{organization.industry || "Technology Sector"}</p>
                      </div>
                    </div>
                    {organization.description && (
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">
                        {organization.description}
                      </p>
                    )}
                    {organization.website && (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink size={12} /> Visit Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Navigation icon in the top bar – clones the passed icon to add consistent size and hover effect
function NavIcon({ icon, label, active = false, href = "#" }: any) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-colors border-b-2 hover:text-white group relative ${active ? "border-white text-white" : "border-transparent text-slate-500"}`}>
        <div className="relative">
          {/* Clone the icon to inject size=20 and a hover scale class – this way the parent doesn't need to worry about sizing */}
          {React.cloneElement(icon, { size: 20, className: "group-hover:scale-110 transition-transform" })}
        </div>
        <span className="hidden lg:block text-[10px] mt-1 font-medium">{label}</span>
      </div>
    </Link>
  );
}

// Single detail row in the sidebar – icon, label, and value
function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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