"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Home, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Newspaper,
  MoreHorizontal,
  ThumbsUp,
  Repeat2,
  Share2,
  Send,
  UserPlus,
  TrendingUp,
  Bookmark,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/src/authStore/page";
import { useRouter } from "next/navigation";


export default function FeedPage() {
  const queryClient = useQueryClient(); // This guy lets us manually refetch data after mutations

  // State for the "what's on your mind?" post creator
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // So we can trigger file picker from a button
  const router = useRouter();
  const { token, user, refreshToken, clearSession } = useAuthStore(); // Our auth state (token, user info)
  const [currentPage, setCurrentPage] = useState(1); // For client-side pagination
  const postsPerPage = 5;
  const API_BASE = ""; // Empty = relative URLs, fine for same-origin API calls

  // Every API call needs the token in the Authorization header
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch the currently logged-in user's basic info (email, role, etc.)
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/User/me`, authHeaders);
      return data;
    },
    enabled: !!token, // Only run if we have a token (user is authenticated)
  });

  // Fetch the user's profile (fullName, headline, photoUrl, etc.) – separate from auth user
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/UserProfile/by-user/${user?.id}`, authHeaders);
      return data;
    },
    enabled: !!user?.id,
  });

  // THE FEED: gets all posts from all users (global feed)
  // Note: this is NOT just "my posts" – it's everyone's posts, like a social media timeline
  const { data: feedPosts = [], isLoading: isLoadingFeed } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const response = await axios.get(`/api/Post/feed`, authHeaders);
      return response.data?.data || response.data?.posts || [];
    },
    enabled: !!token,
  });

  // Helper: upload an image to the server, returns the URL of the uploaded photo
  const { mutateAsync: uploadPhoto, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.post(`/api/Upload/photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return data?.data || "";
    },
  });

  // Logout: calls backend to invalidate refresh token, then clears local session
  const { mutate: logoutUser, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      return await axios.post(
        `/api/Auth/logout`,
        {
          refreshToken: refreshToken,
        },
        authHeaders
      );
    },

    onSuccess: () => {
      clearSession?.(); // wipe token from zustand store
      router.push("/auth/login");
    },

    onError: (err) => {
      console.error("Logout failed:", err);
      clearSession?.();
      router.push("/auth/login");
    },
  });

  // Create a new post (text + optional image)
  const { mutate: createPost, isPending: isPosting } = useMutation({
    mutationFn: async (payload: { content: string; imageUrl: string }) => {
      return await axios.post(`/api/Post`, payload, authHeaders);
    },
    onSuccess: () => {
      // Clear the post composer after successful post
      setPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      // Refetch the feed so the new post shows up immediately
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // Like a post – optimistic? nah, just invalidate feed to refresh counts
  const { mutate: likePost } = useMutation({
    mutationFn: async (postId: number) => {
      await axios.post(`/api/Post/${postId}/like`, {}, authHeaders);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  // Repost a post – same pattern
  const { mutate: repostPost } = useMutation({
    mutationFn: async (postId: number) => {
      await axios.post(`/api/Post/${postId}/repost`, {}, authHeaders);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  // Add a comment to a post
  const { mutate: addComment } = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      await axios.post(`/api/Post/${postId}/comments`, { content }, authHeaders);
    },
    onSuccess: (_data, variables) => {
      // Invalidate both feed (to update comment count) and the specific comments list
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
    },
  });

  // When user selects a file from the hidden input, create a local preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // React.ChangeEvent<HTMLInputElement> – this is the type for an onChange event on an <input>.
    // It gives us e.target.files safely.
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Handle the "Post" button click: first upload image (if any), then create post
  const handlePost = async () => {
    if (!postContent.trim() && !selectedImage) return;
    try {
      let imageUrl = "";
      if (selectedImage) imageUrl = await uploadPhoto(selectedImage);
      createPost({ content: postContent, imageUrl });
    } catch (e) { console.error(e); }
  };

  // Derive display name and avatar initials from userProfile or fallback
  const nameValue = userProfile?.fullName || user?.fullName || "User";
  const initials = nameValue.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const headline = userProfile?.headline || "Professional Member";
  const photo = userProfile?.photoUrl ? `${API_BASE}/uploads/${userProfile.photoUrl}` : null;

  // Client-side pagination: slice the already-fetched feedPosts array
  const totalPages = Math.ceil(feedPosts.length / postsPerPage);
  const paginatedPosts = feedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <div className="bg-[#0a0a0c] text-slate-200 min-h-screen font-sans">
      
      {/*nav */}
      <nav className="fixed top-0 w-full bg-[#15161a] border-b border-white/5 z-50 px-4 h-14 flex items-center justify-center">
        <div className="max-w-[1128px] w-full flex items-center h-full">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
              A
            </div>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search Aether" 
                className="bg-[#1f2029] rounded w-64 h-8 pl-10 pr-4 text-sm focus:w-80 transition-all outline-none border border-transparent focus:border-purple-500/30 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-6 h-full">
            <NavIcon icon={<Home />} label="Home" active={true} />
            <Link href="/network"><NavIcon icon={<Users />} label="Network" /></Link>
            <Link href="/job"><NavIcon icon={<Briefcase />} label="Jobs" /></Link>
            <Link href='/messages'><NavIcon icon={<MessageSquare />} label="Messaging" /></Link>
            <Link href="notifications"><NavIcon icon={<Bell />} label="Notifications" /></Link>
            
            <div className="h-full border-l border-white/5 mx-2 hidden sm:block" />

            <Link href='/profile'>
              <div className="flex flex-col items-center justify-center cursor-pointer group">
                {photo ? (
                  <img src={photo} className="w-6 h-6 rounded-full border border-white/10" alt="me" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">{initials}</div>
                )}
                <span className="text-[11px] text-slate-500 group-hover:text-white flex items-center mt-0.5">Me <ChevronDown className="w-3 h-3 ml-0.5" /></span>
              </div>
            </Link>
            <button
              onClick={() => logoutUser()}
              disabled={isLoggingOut}
              className="flex flex-col items-center text-slate-400 hover:text-red-400 text-xs"
            >
              <LogOut size={18} />
              <span>{isLoggingOut ? "..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1128px] mx-auto pt-20 px-4 grid grid-cols-1 md:grid-cols-[1.5fr_3fr_1.5fr] lg:grid-cols-[225px_1fr_300px] gap-6 pb-20">
        
        {/* LEFT SIDEBAR – user card + links */}
        <aside className="space-y-2">
          <div className="bg-[#15161a] rounded-xl overflow-hidden border border-white/5 shadow-xl">
            <div className="h-14 bg-gradient-to-r from-purple-900 to-pink-900 relative">
              <img src="https://picsum.photos/seed/aether/400/100" className="w-full h-full object-cover opacity-50" alt="cover" />
            </div>
            <div className="px-3 pb-4 text-center">
              <div className="relative -mt-9 mb-2 inline-block">
                {photo ? (
                  <img src={photo} className="w-18 h-18 rounded-full border-4 border-[#15161a] object-cover mx-auto shadow-2xl" alt="avatar" />
                ) : (
                  <div className="w-18 h-18 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 border-4 border-[#15161a] flex items-center justify-center text-2xl font-bold shadow-2xl mx-auto">
                    {initials}
                  </div>
                )}
              </div>
              <h1 className="font-bold text-lg hover:underline cursor-pointer decoration-slate-400">{nameValue}</h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{headline}</p>
            </div>
            <div className="border-t border-white/5 p-3 space-y-3">
              <div className="flex justify-between items-center group cursor-pointer">
                <span className="text-xs text-slate-500 font-bold">Profile viewers</span>
                <span className="text-xs text-purple-400 font-bold">351</span>
              </div>
              <div className="flex justify-between items-center group cursor-pointer">
                <span className="text-xs text-slate-500 font-bold">Post analytics</span>
                <span className="text-xs text-purple-400 font-bold">1.2k</span>
              </div>
            </div>
            <div className="p-3 border-t border-white/5 bg-[#1a1b21] cursor-pointer hover:bg-[#202129] transition-colors rounded-b-xl group">
              <p className="text-[11px] text-slate-500 font-medium">Exclusive tools & insights</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold group-hover:text-purple-400">
                <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-sm" />
                Try Aether Premium
              </div>
            </div>
          </div>

          <div className="bg-[#15161a] rounded-xl border border-white/5 p-3 sticky top-20">
            <div className="space-y-4">
              <Link href="#" className="block text-xs font-bold text-slate-400 hover:text-purple-400 transition-colors">Groups</Link>
              <Link href="#" className="flex justify-between items-center text-xs font-bold text-slate-400 hover:text-purple-400 group transition-colors">
                Events <Plus className="w-3 h-3 text-slate-600 group-hover:text-purple-400" />
              </Link>
              <Link href="#" className="block text-xs font-bold text-slate-400 hover:text-purple-400 transition-colors">Followed Hashtags</Link>
            </div>
            
            <button className="w-full mt-4 pt-4 border-t border-white/5 text-xs font-bold text-slate-600 hover:text-slate-400 text-center py-2 transition-colors">
              Discover more
            </button>
          </div>
        </aside>

        {/* MAIN FEED – post composer + list of posts */}
        <main className="space-y-2">
          {/* "Start a post" box – expands when you type or select an image */}
          <div className="bg-[#15161a] rounded-xl p-4 border border-white/5 shadow-xl mb-4">
            <div className="flex gap-3">
              {photo ? (
                <img src={photo} className="w-12 h-12 rounded-full ring-1 ring-white/10" alt="me" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold">{initials}</div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-grow bg-[#1f2029] hover:bg-[#252631] border border-white/10 rounded-full px-4 text-left text-sm font-bold text-slate-500 transition-all shadow-inner"
              >
                Start a post
              </button>
            </div>
            
            <div className="flex justify-between mt-3 px-1">
              <PostBoxAction icon={<ImageIcon className="text-blue-500" />} label="Photo" onClick={() => fileInputRef.current?.click()} />
              <PostBoxAction icon={<Video className="text-green-500" />} label="Video" onClick={() => {}} />
              <PostBoxAction icon={<Calendar className="text-orange-500" />} label="Event" onClick={() => {}} />
              <PostBoxAction icon={<Newspaper className="text-rose-500" />} label="Article" onClick={() => {}} />
            </div>

            {/* Expanded post editor – appears when user starts typing or adds an image */}
            {(postContent || selectedImage) && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                <textarea 
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full bg-transparent outline-none resize-none min-h-[100px] text-sm text-slate-300 placeholder-slate-600"
                  placeholder="What's your latest insight?"
                />
                
                {imagePreview && (
                  <div className="relative group rounded-xl overflow-hidden border border-white/10">
                    <img src={imagePreview} className="w-full max-h-96 object-cover" alt="preview" />
                    <button 
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-black transition-colors"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => { setPostContent(""); setSelectedImage(null); setImagePreview(null); }}
                    className="px-4 py-1.5 rounded-full text-sm font-bold text-slate-400 hover:bg-white/5"
                  >
                    Clear
                  </button>
                  <button 
                    disabled={isPosting || isUploading}
                    onClick={handlePost}
                    className="px-6 py-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isPosting || isUploading ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            )}
            {/* Hidden file input for image uploads */}
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
          </div>

          {/* The actual list of posts – paginated client-side */}
          <div className="space-y-2">
            {isLoadingFeed ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              paginatedPosts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  token={token}
                  onLike={() => likePost(post.id)} 
                  onRepost={() => repostPost(post.id)}
                  onComment={(content: string) => addComment({ postId: post.id, content })}
                />
              ))
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR – suggestions & trending */}
        <aside className="space-y-2 hidden lg:block">
          <div className="bg-[#15161a] rounded-xl border border-white/5 p-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold">Add to your feed</h2>
              <MoreHorizontal className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>
            
            <div className="space-y-4">
              <SuggestedItem name="Sarah Chen" bio="AI Researcher @ Lab-X" />
              <SuggestedItem name="Marcus Gray" bio="Founder of SoftClub" />
              <SuggestedItem name="Julia Roberts" bio="Senior Tech Recruiter" />
            </div>

            <button className="flex items-center gap-1 mt-4 px-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
              View all recommendations <Users className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-[#15161a] rounded-xl border border-white/5 p-3 sticky top-20">
            <h2 className="text-sm font-bold mb-4">Trending topics</h2>
            <div className="space-y-4">
              <TrendingItem tag="#NeuralNetworks" count="42.5k posts" />
              <TrendingItem tag="#AetherNetwork" count="18.2k posts" />
              <TrendingItem tag="#RemoteFirst" count="12.1k posts" />
              <TrendingItem tag="#FinTech2024" count="9.4k posts" />
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap justify-center gap-x-3 gap-y-1 opacity-50 px-2">
              <FooterLink label="About" />
              <FooterLink label="Accessibility" />
              <FooterLink label="Help Center" />
              <FooterLink label="Privacy & Terms" />
            </div>
            <p className="mt-4 text-[10px] font-bold text-center text-slate-700">Aether Corporation © 2026</p>
          </div>
        </aside>
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
  );
}



// NavIcon – each icon in the top bar, with optional active state and badge
const NavIcon = ({ icon, label, active = false, badge = 0 }: any) => (
  <div className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-colors border-b-2 hover:text-white group relative ${active ? "border-white text-white" : "border-transparent text-slate-500"}`}>
    <div className="relative">
      {React.cloneElement(icon, { size: 20, className: "group-hover:scale-110 transition-transform" })}
      {badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center">{badge}</span>}
    </div>
    <span className="hidden lg:block text-[10px] mt-1 font-medium">{label}</span>
  </div>
);

// Small action button inside the post composer like Photo Video etc.
const PostBoxAction = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-2 hover:bg-white/5 p-2 rounded transition-colors cursor-pointer group">
    {React.cloneElement(icon, { size: 18 })}
    <span className="text-[13px] font-bold text-slate-500 group-hover:text-slate-300">{label}</span>
  </button>
);

// One single post card – includes author info, content, image, like/comment/repost buttons, and comments section
const PostCard = ({ post, token, onLike, onRepost, onComment }: any) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch the profile of the person who wrote this post (because feed only gives userId)
  const { data: postAuthor } = useQuery({
    queryKey: ["userProfile", post.userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/UserProfile/by-user/${post.userId}`, authHeaders);
      return data?.data || data;
    },
    enabled: !!post.userId && !!token,
  });

  // Fetch comments only when the user expands the comments section – saves bandwidth
  const { data: commentsData = [] } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/Post/${post.id}/comments`, authHeaders);
      return data?.data || data || [];
    },
    enabled: showComments && !!token,
  });

  // Derive author name from fetched profile, or fallback
  const authorName = postAuthor?.fullName || postAuthor?.firstName ? `${postAuthor.firstName} ${postAuthor.lastName || ""}`.trim() : (post.authorName || "User");
  const authorInitials = authorName.slice(0, 2).toUpperCase();

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(commentText);
    setCommentText("");
  };

  return (
    <div className="bg-[#15161a] rounded-xl border border-white/5 overflow-hidden shadow-lg hover:shadow-black/20 transition-all">
      {/* Header: avatar + name + timestamp */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex gap-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold uppercase ring-1 ring-white/10">
            {authorInitials}
          </div>
          <div>
            <div className="flex items-center gap-1 group cursor-pointer">
              <h3 className="text-sm font-bold group-hover:text-purple-400 group-hover:underline underline-offset-2">{authorName}</h3>
              <span className="text-xs text-slate-600 font-medium">• 2nd</span>
            </div>
            <p className="text-[11px] text-slate-500">Expert Contributor at Aether Network</p>
            <p className="text-[10px] text-slate-700 mt-1 uppercase tracking-tighter">4h • <Home size={10} className="inline ml-0.5"/></p>
          </div>
        </div>
        <button className="text-slate-600 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post text content */}
      <div className="px-3 pb-3">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Optional image attached to post */}
      {post.imageUrl && (
        <div className="bg-[#0a0a0c] border-y border-white/5 flex items-center justify-center cursor-pointer overflow-hidden">
          <img
            src={
              post.imageUrl.startsWith("http")
                ? post.imageUrl
                : post.imageUrl.startsWith("/uploads")
                ? post.imageUrl
                : `/uploads/${post.imageUrl}`
            }
            className="w-full object-cover"
            alt="post"
          />
        </div>
      )}

      {/* Engagement stats row: reactions + comments/reposts count */}
      <div className="px-3 py-1 flex justify-between items-center text-[10px] font-bold text-slate-600 border-b border-white/5 mx-1">
        <div className="flex items-center gap-1 hover:text-purple-400 cursor-pointer transition-colors group">
          <div className="flex -space-x-1.5">
            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center ring-1 ring-[#15161a]"><ThumbsUp size={10} className="text-white" /></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-1 ring-[#15161a]"><Bell size={10} className="text-white" /></div>
          </div>
          {post.likeCount || 0} reactions
        </div>
        <div
          className="hover:text-purple-400 cursor-pointer transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          {commentsData.length || 0} comments • {post.repostCount || 0} reposts
        </div>
      </div>

      {/* Action buttons: Like, Comment, Repost, Send */}
      <div className="flex px-1 py-1">
        <PostAction icon={<ThumbsUp />} label="Like" onClick={onLike} color="blue" />
        <PostAction icon={<MessageSquare />} label="Comment" onClick={() => setShowComments(!showComments)} color="slate" />
        <PostAction icon={<Repeat2 />} label="Repost" onClick={onRepost} color="green" />
        <PostAction icon={<Send />} label="Send" onClick={() => {}} color="slate" />
      </div>

      {/* Comments section – only rendered if showComments is true */}
      {showComments && (
        <div className="border-t border-white/5 px-3 py-3 space-y-3">

          {/* List of existing comments */}
          {commentsData.length > 0 && (
            <div className="space-y-3">
              {commentsData.map((c: any) => (
                <CommentItem key={c.id} comment={c} token={token} />
              ))}
            </div>
          )}

          {/* Input to add a new comment */}
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              Me
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[#1f2029] rounded-full px-4 border border-white/10 focus-within:border-purple-500/40 transition-colors">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent outline-none text-xs py-2 text-slate-300 placeholder-slate-600"
              />
              <button onClick={handleComment} disabled={!commentText.trim()}>
                <Send size={14} className={commentText.trim() ? "text-purple-400" : "text-slate-700"} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

// A single comment – fetches the commenter's profile lazily (again, to show their name)
const CommentItem = ({ comment, token }: { comment: any; token: string }) => {
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const { data: commenter } = useQuery({
    queryKey: ["userProfile", comment.userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/UserProfile/by-user/${comment.userId}`, authHeaders);
      return data?.data || data;
    },
    enabled: !!comment.userId && !!token,
  });

  const name = commenter?.fullName || commenter?.firstName ? `${commenter.firstName} ${commenter.lastName || ""}`.trim() : "User";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold uppercase ring-1 ring-white/10 shrink-0">
        {initials}
      </div>
      <div className="bg-[#1f2029] rounded-2xl px-3 py-2 text-sm text-slate-300 flex-1">
        <p className="text-[11px] font-bold text-purple-400 mb-0.5">{name}</p>
        <p className="text-xs leading-relaxed">{comment.content}</p>
      </div>
    </div>
  );
};

// Like/Comment/Repost/Send button inside each post
const PostAction = ({ icon, label, onClick, color }: any) => {
  const colorMap: any = {
    blue: "hover:text-blue-400",
    green: "hover:text-green-400",
    slate: "hover:text-slate-100"
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md transition-all text-slate-500 font-bold text-xs hover:bg-white/5 ${colorMap[color] || ""}`}
    >
       {React.cloneElement(icon, { size: 18 })}{/* creates a modified copy of a React element  */}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// A suggested user to follow in the right sidebar
const SuggestedItem = ({ name, bio }: any) => (
  <div className="flex gap-2 items-start justify-between group">
    <div className="flex gap-2">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center font-bold text-sm shadow-xl">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <h4 className="text-xs font-bold hover:underline cursor-pointer decoration-slate-400">{name}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{bio}</p>
        <button className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-600 hover:border-slate-300 hover:bg-white/5 text-[11px] font-bold text-slate-400 hover:text-white transition-all">
          <UserPlus size={14} /> Follow
        </button>
      </div>
    </div>
  </div>
);

// A trending topic / hashtag item
const TrendingItem = ({ tag, count }: any) => (
  <div className="cursor-pointer group">
    <div className="flex justify-between items-center">
      <h4 className="text-xs font-bold text-slate-300 group-hover:text-purple-400 transition-colors">{tag}</h4>
      <TrendingUp size={12} className="text-slate-700 group-hover:text-purple-500" />
    </div>
    <p className="text-[10px] text-slate-600 font-medium mt-0.5">{count}</p>
  </div>
);

// Tiny footer link (About, Help, etc.)
const FooterLink = ({ label }: { label: string }) => (
  <a href="#" className="text-[10px] font-bold text-slate-600 hover:text-purple-400 transition-colors">{label}</a>
);