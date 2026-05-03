import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { useAuth } from "@/lib/auth-context"; 
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/app/community")({
  head: () => ({ meta: [{ title: "Community — Udaan" }] }),
  component: CommunityPage,
});

// Category definition
const CATEGORIES = [
  { id: "navigation", label: "Navigation", color: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700" },
  { id: "jobs", label: "Jobs", color: "bg-green-100 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700" },
  { id: "schemes", label: "Schemes", color: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700" },
  { id: "alert", label: "Alert", color: "bg-red-100 text-red-900 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700" },
  { id: "general", label: "General", color: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700" },
] as const;

type Category = typeof CATEGORIES[number]["id"];

type Post = {
  id: string;
  name?: string;     // Legacy
  userName?: string; // Database
  text: string;
  tag: Category;
  time?: number;
  timestamp?: string;
  likes: number;
  isMod: boolean | number;
};

type Flag = {
  postId: string;
  reason: string;
  timestamp: number;
};

const SEED_POSTS: Post[] = [
  { id: "p1", name: "Ravi S.", text: "The new ramp at Bangalore Majestic metro station is finally open! Much easier for wheelchair access now.", tag: "navigation", time: Date.now() - 3600000 * 24 * 2, likes: 45, isMod: false },
  { id: "p2", name: "Anjali Gupta", text: "TCS is hiring PwD candidates for remote software engineering roles. Last date to apply is Friday. DM for referral links.", tag: "jobs", time: Date.now() - 3600000 * 5, likes: 120, isMod: true },
  { id: "p3", name: "Kiran Kumar", text: "Can someone help me understand the documents required for the Niramaya Health Insurance scheme?", tag: "schemes", time: Date.now() - 3600000 * 12, likes: 14, isMod: false },
  { id: "p4", name: "System Alert", text: "Heavy rains reported in Chennai. Several lower access ramps in T. Nagar might be flooded. Please plan travel accordingly.", tag: "alert", time: Date.now() - 3600000 * 2, likes: 89, isMod: true },
  { id: "p5", name: "Meera K.", text: "Attended the inclusive design meetup today. So great to see so many allies working towards accessible tech!", tag: "general", time: Date.now() - 3600000 * 24, likes: 32, isMod: false },
];

function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"feed" | "stats" | "moderation">("feed");
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  
  // Flag & Share state
  const [flags, setFlags] = useState<Flag[]>([]);
  const [flagModalOpen, setFlagModalOpen] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string>("");
  const [showFlagSuccess, setShowFlagSuccess] = useState<string | null>(null);
  const [sharePopoverOpen, setSharePopoverOpen] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  // Compose state
  const [composeName, setComposeName] = useState("");
  const [composeText, setComposeText] = useState("");
  const [composeTag, setComposeTag] = useState<Category | "">("");
  
  const a11y = useA11y();
  const t = useT();
  const { role } = useAuth();
  const isModerator = role === "moderator";

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/community/posts");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: any) => ({
          ...p,
          time: new Date(p.timestamp).getTime(),
          isMod: Boolean(p.isMod)
        }));
        setPosts(mapped);
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  };

  const loadFlags = async () => {
    try {
      const res = await fetch("/api/community/flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      }
    } catch (err) {
      console.error("Failed to load flags:", err);
    }
  };

  useEffect(() => {
    loadPosts();
    loadFlags();

    const savedLikes = localStorage.getItem("liked-posts");
    if (savedLikes) {
      setLikedPosts(JSON.parse(savedLikes));
    }
  }, []);

  // Save specific local state
  useEffect(() => {
    localStorage.setItem("liked-posts", JSON.stringify(likedPosts));
  }, [likedPosts]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim() || !composeTag) return;
    
    const newPost = {
      id: "p" + Date.now().toString() + Math.random().toString(36).substring(2, 7),
      userName: composeName.trim() || t("Anonymous"),
      userId: "user_" + Math.random().toString(36).substring(2, 7), // Mocking user ID
      text: composeText.trim(),
      tag: composeTag as Category,
      isMod: role === "moderator" ? 1 : 0,
    };

    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost)
      });
      
      if (res.ok) {
        setComposeText("");
        setComposeTag("");
        loadPosts();
        a11y.speak(t("Post published successfully to the community feed."), "assistant");
      }
    } catch (err) {
      console.error("Failed to publish post:", err);
    }
  };

  const handleLike = async (id: string) => {
    const isLiked = likedPosts[id];
    setLikedPosts(prev => ({ ...prev, [id]: !isLiked }));
    
    // Update locally for instant feel
    setPosts(prev => prev.map(p => {
      if (p.id === id) return { ...p, likes: p.likes + (isLiked ? -1 : 1) };
      return p;
    }));

    try {
      await fetch(`/api/community/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: !isLiked })
      });
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") return posts;
    return posts.filter(p => p.tag === activeFilter);
  }, [posts, activeFilter]);

  const timeAgo = (ms: number) => {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}${t("d ago")}`;
    if (hours > 0) return `${hours}${t("h ago")}`;
    if (minutes > 0) return `${minutes}${t("m ago")}`;
    return t("just now");
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = posts.length;
    const byCategory = CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = posts.filter(p => p.tag === cat.id).length;
      return acc;
    }, {} as Record<string, number>);
    const topPosts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);
    return { total, byCategory, topPosts };
  }, [posts]);

  // Moderation calculation
  const flaggedPostsList = useMemo(() => {
    const flagged = posts.filter(post => flags.some(f => f.postId === post.id));
    return flagged.sort((a, b) => {
      const aFlags = flags.filter(f => f.postId === a.id).length;
      const bFlags = flags.filter(f => f.postId === b.id).length;
      return bFlags - aFlags;
    });
  }, [posts, flags]);

  const dismissFlags = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/flags`, { method: "DELETE" });
      if (res.ok) {
        setFlags(prev => prev.filter(f => f.postId !== postId));
        a11y.speak(t("Flags dismissed for this post."), "assistant");
      }
    } catch (err) {
      console.error("Failed to dismiss flags:", err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setFlags(prev => prev.filter(f => f.postId !== postId));
        a11y.speak(t("Post deleted by moderator."), "assistant");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 md:px-0">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">{t("Community Forum")}</h1>
          <p className="text-muted-foreground mt-1 text-base font-medium">{t("Share accessibility tips, jobs, and local updates.")}</p>
        </div>
      </header>

      <div className="flex gap-2 mb-6 border-b-2 border-border pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          onClick={() => setActiveTab("feed")} 
          aria-selected={activeTab === "feed"}
          className={`px-4 py-2 font-bold rounded-t-lg transition ${activeTab === "feed" ? "border-b-4 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("Feed")}
        </button>
        <button 
          onClick={() => setActiveTab("stats")} 
          aria-selected={activeTab === "stats"}
          className={`px-4 py-2 font-bold rounded-t-lg transition ${activeTab === "stats" ? "border-b-4 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          {t("Stats")}
        </button>
        {isModerator && (
          <button 
            onClick={() => setActiveTab("moderation")} 
            aria-selected={activeTab === "moderation"}
            className={`px-4 py-2 font-bold rounded-t-lg transition flex items-center gap-2 ${activeTab === "moderation" ? "border-b-4 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("🛡️ Moderation")}
            {flags.length > 0 && (
              <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[10px] font-black">
                {new Set(flags.map(f => f.postId)).size}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === "feed" ? (
        <div className="space-y-6">
          {/* Compose Box */}
          <div className="bg-card border-2 border-border p-5 rounded-2xl shadow-soft">
            <form onSubmit={handlePost} className="space-y-4">
              <div className="relative">
                <textarea
                  placeholder={t("Share a tip, job, or update...")}
                  value={composeText}
                  onChange={e => {
                    if (e.target.value.length <= 280) setComposeText(e.target.value);
                  }}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 min-h-[100px] font-medium text-foreground focus:border-primary outline-none transition resize-none"
                  aria-label={t("Post content")}
                />
                <div className={`absolute bottom-3 right-4 text-[10px] font-black ${280 - composeText.length < 20 ? "text-red-500" : "text-muted-foreground"}`}>
                  {composeText.length}/280
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setComposeTag(cat.id)}
                      aria-pressed={composeTag === cat.id}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition ${composeTag === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-muted-foreground"}`}
                    >
                      {t(cat.label)}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!composeText.trim() || !composeTag}
                  className="w-full sm:w-auto bg-primary text-primary-foreground font-black px-8 py-3 rounded-xl hover:translate-y-[-2px] disabled:opacity-50 disabled:translate-y-0 shadow-lg transition active:scale-95"
                >
                  {t("Post")}
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center py-4 border-y-2 border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              aria-pressed={activeFilter === "all"}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 transition ${activeFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground hover:border-muted-foreground"}`}
            >
              {t("All")}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                aria-pressed={activeFilter === cat.id}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 transition ${activeFilter === cat.id ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground hover:border-muted-foreground"}`}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-card border-2 border-border rounded-2xl">
                <span className="text-4xl mb-4 block" aria-hidden>📭</span>
                <p className="text-muted-foreground font-black">{t("No posts yet. Be the first to share!")}</p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const catInfo = CATEGORIES.find(c => c.id === post.tag);
                const isLiked = likedPosts[post.id];
                const displayName = post.userName || post.name || "Anonymous";
                const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "?";
                const flagCount = flags.filter(f => f.postId === post.id).length;
                const isUnderReview = flagCount >= 3;
                const postTime = post.time || (post.timestamp ? new Date(post.timestamp).getTime() : Date.now());
                
                return (
                  <article key={post.id} className="bg-card border-2 border-border p-5 rounded-2xl hover:border-primary/50 transition relative overflow-hidden group">
                    {isUnderReview && (
                      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-10 flex items-center justify-center p-6 text-center">
                        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl">
                          <p className="font-black text-red-700 text-sm">⚠️ {t("POST UNDER REVIEW")}</p>
                          <p className="text-xs text-red-600 mt-1">{t("This post has been reported multiple times and is hidden.")}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-black text-xs shrink-0 border border-border">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-black text-sm truncate">{post.userName || post.name}</h2>
                          {post.isMod ? <span className="bg-blue-100 text-blue-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Expert</span> : null}
                          <span className="text-[10px] text-muted-foreground">· {timeAgo(postTime)}</span>
                        </div>
                        
                        {catInfo && (
                           <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border mb-3 ${catInfo.color}`}>
                             {t(catInfo.label)}
                           </span>
                        )}

                        <p className="text-sm font-medium leading-relaxed mb-4 text-foreground/90">
                          {post.text}
                        </p>

                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-black transition ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                          >
                            {isLiked ? "❤️" : "🤍"} {post.likes}
                          </button>
                          
                          <button 
                            onClick={() => {
                              const shareText = `${post.text} — via Udaan`;
                              if (navigator.share) navigator.share({ text: shareText });
                              else {
                                navigator.clipboard.writeText(shareText);
                                toast.success("Link copied!");
                              }
                            }}
                            className="text-xs font-black text-muted-foreground hover:text-primary transition"
                          >
                            📤 Share
                          </button>

                          <button 
                            onClick={() => setFlagModalOpen(post.id)}
                            className="ml-auto text-xs font-black text-muted-foreground hover:text-orange-500 transition opacity-0 group-hover:opacity-100"
                          >
                            🚩 Report
                          </button>
                        </div>
                      </div>
                    </div>

                    {flagModalOpen === post.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <div className="bg-card border-2 border-border rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                          <h3 className="text-lg font-black mb-4">{t("Report Post")}</h3>
                          <div className="space-y-2 mb-6">
                            {["Spam", "Wrong Info", "Offensive"].map(reason => (
                              <button 
                                key={reason}
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/community/posts/${post.id}/flag`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ reason, userId: "pwd_candidate_1" })
                                    });
                                    if (res.ok) {
                                      loadFlags();
                                      setFlagModalOpen(null);
                                      toast.success("Reported successfully");
                                    }
                                  } catch (err) {
                                    console.error("Failed to flag:", err);
                                  }
                                }}
                                className="w-full text-left p-3 rounded-xl border-2 border-border font-bold hover:border-red-500 hover:text-red-600 transition"
                              >
                                {t(reason)}
                              </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => setFlagModalOpen(null)}
                            className="w-full py-3 text-sm font-black text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === "stats" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-soft">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{t("Community Health")}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold">Total Knowledge Shared</span>
                <span className="text-3xl font-black">{stats.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(stats.total / 100) * 100}%` }} />
              </div>
            </div>
          </div>
          
          <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-soft">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{t("Top Contributors")}</h3>
            <div className="space-y-4">
              {stats.topPosts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">#{i+1}</span>
                  <span className="text-sm font-bold truncate flex-1">{p.userName || p.name || "Anonymous"}</span>
                  <span className="text-[10px] font-black text-muted-foreground">{p.likes} ❤️</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedPostsList.length === 0 ? (
             <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
               <p className="text-muted-foreground font-black text-sm">{t("Moderation queue is clean!")}</p>
             </div>
          ) : (
            flaggedPostsList.map(post => (
              <div key={post.id} className="bg-card border-2 border-border p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-black text-sm">{post.userName || post.name || "Anonymous"}</span>
                  <span className="bg-red-100 text-red-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Flagged</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {timeAgo(post.time || (post.timestamp ? new Date(post.timestamp).getTime() : Date.now()))}
                  </span>
                </div>
                <p className="text-sm mb-4 bg-muted p-3 rounded-lg italic">"{post.text}"</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => dismissFlags(post.id)}
                    className="flex-1 bg-green-500 text-white font-black py-2 rounded-xl text-xs"
                  >
                    Allow
                  </button>
                  <button 
                    onClick={() => deletePost(post.id)}
                    className="flex-1 bg-red-500 text-white font-black py-2 rounded-xl text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
