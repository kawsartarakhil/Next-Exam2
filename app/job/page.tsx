"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Search, 
  Briefcase, 
  Building2, 
  Users, 
  TrendingUp, 
  ArrowRight,
  MapPin,
  ChevronRight,
  Globe,
  Home,
  MessageSquare,
  Bell,
  ChevronDown,
  LogOut,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/authStore/page";

// API base – empty means relative URLs, works when backend is on same origin
const API_BASE = "";
// Preconfigured axios instance with default headers – saves repetition
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default function JobsHubPage() {
  // Grab auth state: token, user, and logout helpers
  const { token, user: authUser, clearSession, refreshToken } = useAuthStore();
  const router = useRouter();

  // Local state for search filter and pagination (client-side pagination for now)
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  // Headers with the auth token – every API call needs this
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };


  // Get all organizations from the backend
  const { data: orgsResponse } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await api.get("/api/Organization", authHeaders);
      return data?.data || [];
    },
    enabled: !!token, // only fetch if we're logged in
  });

  // Get all job listings
  const { data: jobsResponse } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data } = await api.get("/api/Job", authHeaders);
      return data?.data || [];
    },
    enabled: !!token,
  });

  // Extract arrays from responses (or empty fallback)
  const organizations = orgsResponse || [];
  const jobs = jobsResponse || [];

  // Client-side pagination for jobs – simple slicing, no server-side limits yet
  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + jobsPerPage);

  // These numbers are partially static + dynamic (orgs.length, jobs.length)
  const stats = [
    { label: "Active Organizations", value: organizations.length + 1200, icon: <Building2 className="text-blue-400" /> },
    { label: "Available Positions", value: jobs.length + 450, icon: <Briefcase className="text-purple-400" /> },
    { label: "Talented Specialists", value: "15k+", icon: <Users className="text-green-400" /> },
    { label: "Network Growth", value: "24%", icon: <TrendingUp className="text-pink-400" /> },
  ];

  // Logout: call backend to invalidate refresh token, then clear local store and redirect
  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/api/Auth/logout", { refreshToken }, authHeaders);
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      clearSession(); // nuke token from Zustand
      router.push("/auth/login");
    }
  };

  return (
    <div className="bg-[#0a0a0c] text-slate-200 min-h-screen font-sans selection:bg-purple-500/30">
      
     
      <nav className="fixed top-0 w-full bg-[#15161a]/80 backdrop-blur-md border-b border-white/5 z-50 px-4 h-14 flex items-center justify-center">
        <div className="max-w-[1128px] w-full flex items-center h-full">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/feed">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20 cursor-pointer hover:scale-105 transition-transform">
                A
              </div>
            </Link>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Find opportunities..." 
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 h-full">
            <NavIcon icon={<Home />} label="Home" href="/feed" />
            <NavIcon icon={<Users />} label="Network" href="/network" />
            <NavIcon icon={<Briefcase />} label="Jobs" active={true} href="/job" />
            <NavIcon icon={<MessageSquare />} label="Messaging" href="/messages" />
            <NavIcon icon={<Bell />} label="Notifications" href="/notifications" />
            
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <button 
              onClick={handleLogout}
              className="flex flex-col items-center justify-center cursor-pointer group text-slate-500 hover:text-rose-400 transition-colors p-1"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden lg:block text-[10px] mt-1 font-medium">Logout</span>
            </button>

            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

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

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-[1128px] mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <Sparkles size={14} /> Discovery Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Uncover the Best Positions <br /> in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Aether Ecosystem</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg font-medium leading-relaxed">
            Connect with innovative Aether organizations and discover the professional transmission of your dreams in the neural network.
          </p>

          {/* Search Box – currently only frontend filtering, no backend call yet */}
          <div className="max-w-xl mx-auto mt-10 relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full opacity-50" />
            <div className="relative flex items-center p-2 bg-[#15161a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
               <Search className="ml-4 text-slate-500" />
               <input 
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Company names or industries..."
                 className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-200 border-none placeholder:text-slate-600"
               />
               <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-500/20">
                 Explore
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1128px] mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#15161a] border border-white/5 p-6 rounded-2xl flex items-center gap-4 group hover:border-purple-500/30 transition-all cursor-default">
            <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">{s.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[1128px] mx-auto px-4 pb-12">
        <div className="flex justify-between items-end mb-8 border-l-4 border-purple-500 pl-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">Vanguard Organizations</h2>
            <p className="text-slate-500 font-medium">Leading forces in the neural revolution</p>
          </div>
          <Link href="#" className="flex items-center gap-2 text-purple-400 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all">
            Expose all <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* If we have real orgs from backend, show them; otherwise fallback to mock cards */}
           {organizations.length > 0 ? (
             organizations.map((org: any) => (
               <OrganizationCard key={org.id} org={org} />
             ))
           ) : (
             <>
               <MockOrgCard name="Neural Innovations LLC" industry="IT & DATA SYSTEMS" location="DUBAI, UAE" banner="vibrant" initial="N" />
               <MockOrgCard name="Aether Dynamics" industry="QUANTUM COMPUTING" location="REMOTE HUB" banner="cosmic" initial="A" />
               <MockOrgCard name="Prism Design Labs" industry="VISUAL INTERFACE" location="TOKYO, JP" banner="nebula" initial="P" />
             </>
           )}
        </div>
      </div>

      <div id="jobs-section" className="max-w-[1128px] mx-auto px-4 pb-24">
        <div className="flex justify-between items-end mb-8 border-l-4 border-pink-500 pl-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">Neural Transmissions</h2>
            <p className="text-slate-500 font-medium">New job opportunities appearing in the ecosystem</p>
          </div>
          <Link href="#" className="flex items-center gap-2 text-pink-400 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all">
            Browse all roles <ArrowRight size={18} />
          </Link>
        </div>

        <div className="space-y-4">
           {jobs.length > 0 ? (
             paginatedJobs.map((job: any) => (
               <JobListItem key={job.id} job={job} />
             ))
           ) : (
             <div className="text-center py-20 bg-[#15161a] rounded-3xl border border-white/5 border-dashed">
                <p className="text-slate-500 italic">No job transmissions detected in the current sector.</p>
             </div>
           )}
        </div>
       {/* Pagination controls – only show if more than one page */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-[#15161a] border border-white/10 text-sm font-bold disabled:opacity-40"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => ( //he Array.from({ length: totalPages }, (_, i) => ...) is a concise way to generate an array of a given length (totalPages) and then map over it to create pagination buttons
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${
                currentPage === i + 1
                  ? "bg-purple-600 text-white"
                  : "bg-[#15161a] border border-white/10 text-slate-400"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-[#15161a] border border-white/10 text-sm font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
      </div>

    </div>
  );
}



// Individual job item in the list – shows title, location, salary, and a "Analyze Detail" button
function JobListItem({ job }: { job: any }) {
  const router = useRouter();

  return (
    <div className="group bg-[#15161a] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6 hover:border-pink-500/30 transition-all shadow-lg hover:shadow-pink-500/5">
       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl font-black text-pink-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
          {job.title?.[0].toUpperCase()}
       </div>
       
       <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-bold text-slate-100 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{job.title}</h4>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-1">
             <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                <Building2 size={12} className="text-slate-600" /> Aether Network
             </span>
             <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                <MapPin size={12} className="text-slate-600" /> {job.location || "REMOTE"}
             </span>
             <span className="flex items-center gap-1 text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                {job.jobType || "FULL-TIME"}
             </span>
          </div>
       </div>

       <div className="text-right hidden md:block px-6 border-x border-white/5">
          <div className="text-sm font-black text-slate-200">${job.salaryMin?.toLocaleString() || "80k"} - ${job.salaryMax?.toLocaleString() || "120k"}</div>
          <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Annual Flux</div>
       </div>

       <button 
         onClick={() => router.push(`/jobDetail/${job.id}`)}
         className="w-full md:w-auto px-8 py-3 bg-white/5 hover:bg-pink-600 text-slate-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
       >
          Analyze Detail
       </button>
       
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

// Card for a real organization (from backend)
function OrganizationCard({ org }: { org: any }) {
  const router = useRouter();
  
  return (
    <div className="group bg-[#15161a] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/40 transition-all duration-500 shadow-xl hover:shadow-purple-500/10">
       <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 relative">
          <img src={`https://picsum.photos/seed/${org.id}/600/300`} className="w-full h-full object-cover opacity-60 mix-blend-overlay" alt="banner" />
          <div className="absolute -bottom-6 left-6">
             <div className="w-16 h-16 rounded-2xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center text-3xl font-black text-purple-400 shadow-2xl group-hover:rotate-6 transition-transform">
                {org.name?.[0].toUpperCase()}
             </div>
          </div>
       </div>
       
       <div className="pt-10 px-6 pb-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold line-clamp-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{org.name}</h3>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-wider">
               <span className="flex items-center gap-1 uppercase"><Globe size={12} className="text-purple-500" /> TECH SECTOR</span>
               <span className="mx-1">•</span>
               <span className="flex items-center gap-1 uppercase"><MapPin size={12} className="text-pink-500" /> {org.location || "SILICON VALLEY"}</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed min-h-[40px]">
            {org.description || "A pioneering force in the digital landscape, focused on pushing the neural boundaries of Aether technology."}
          </p>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
             <div className="flex gap-4">
                <div className="text-center">
                   <div className="text-sm font-black text-slate-200">1.2k</div>
                   <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Followers</div>
                </div>
                <div className="text-center">
                   <div className="text-sm font-black text-slate-200">12</div>
                   <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Open Roles</div>
                </div>
             </div>
             <button 
               onClick={() => router.push(`/job/org/${org.id}`)}
               className="p-3 bg-white/5 hover:bg-purple-600 hover:text-white rounded-2xl text-slate-400 transition-all group/btn shadow-inner"
             >
                <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
       </div>
    </div>
  );
}

// Mock organization card – used when backend returns no orgs (for demo/empty state)
function MockOrgCard({ name, industry, location, banner, initial }: any) {
  return (
    <div className="group bg-[#15161a] border border-white/5 rounded-3xl overflow-hidden hover:border-pink-500/40 transition-all duration-500 shadow-xl hover:shadow-pink-500/10">
       <div className="h-32 bg-slate-900 relative">
          <img src={`https://picsum.photos/seed/${banner}/600/300`} className="w-full h-full object-cover opacity-40 mix-blend-screen" alt="banner" />
          <div className="absolute -bottom-6 left-6">
             <div className="w-16 h-16 rounded-2xl bg-[#0a0a0c] border border-white/10 flex items-center justify-center text-3xl font-black text-pink-400 shadow-2xl group-hover:-rotate-6 transition-transform animate-in fade-in zoom-in">
                {initial}
             </div>
          </div>
       </div>
       
       <div className="pt-10 px-6 pb-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold line-clamp-1 group-hover:text-pink-400 transition-colors uppercase tracking-tight">{name}</h3>
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-wider">
               <span className="flex items-center gap-1 uppercase"><Sparkles size={12} className="text-pink-500" /> {industry}</span>
               <span className="mx-1">•</span>
               <span className="flex items-center gap-1 uppercase"><MapPin size={12} className="text-blue-500" /> {location}</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed min-h-[40px]">
            Building the infrastructure of tomorrow. We are seeking visionaries to join our quest in the Aether.
          </p>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
             <div className="flex gap-4">
                <div className="text-center">
                   <div className="text-sm font-black text-slate-200">850</div>
                   <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Followers</div>
                </div>
                <div className="text-center">
                   <div className="text-sm font-black text-slate-200">5</div>
                   <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Open Roles</div>
                </div>
             </div>
             <button className="p-3 bg-white/5 hover:bg-pink-600 hover:text-white rounded-2xl text-slate-400 transition-all group/btn shadow-inner">
                <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
       </div>
    </div>
  );
}