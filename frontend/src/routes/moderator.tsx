import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/moderator")({
  component: ModeratorDashboard,
});

type Post = {
  id: string;
  userName?: string;
  name?: string;
  text: string;
  tag: string;
  timestamp?: string;
  likes: number;
};

type Flag = {
  id: string;
  postId: string;
  reason: string;
  timestamp: string;
};

function ModeratorDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [postsRes, flagsRes] = await Promise.all([
        fetch("/api/community/posts"),
        fetch("/api/community/flags")
      ]);
      if (postsRes.ok && flagsRes.ok) {
        setPosts(await postsRes.json());
        setFlags(await flagsRes.json());
      }
    } catch (err) {
      toast.error("Failed to sync with database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if authorized
    const session = localStorage.getItem("db_session");
    if (session !== "moderator") {
      navigate({ to: "/auth/moderator-login" });
      return;
    }
    loadData();
  }, []);

  const flaggedPosts = useMemo(() => {
    const postMap = posts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, Post>);
    const reportsByPost = flags.reduce((acc, f) => {
      if (!acc[f.postId]) acc[f.postId] = [];
      acc[f.postId].push(f);
      return acc;
    }, {} as Record<string, Flag[]>);

    return Object.entries(reportsByPost).map(([postId, reports]) => ({
      post: postMap[postId],
      reports
    })).filter(item => item.post); // Only show if post still exists
  }, [posts, flags]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setFlags(prev => prev.filter(f => f.postId !== postId));
        toast.success("Post deleted permanently");
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleDismiss = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/flags`, { method: "DELETE" });
      if (res.ok) {
        setFlags(prev => prev.filter(f => f.postId !== postId));
        toast.success("Flags dismissed. Content is now safe.");
      }
    } catch (err) {
      toast.error("Failed to dismiss flags");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("db_session");
    navigate({ to: "/auth/moderator-login" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b-2 border-border px-8 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-card/90">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <h1 className="text-xl font-black tracking-tight">Community Moderation Console</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/app/community" className="text-sm font-bold text-primary hover:underline">View Public Feed</Link>
          <button 
            onClick={handleLogout}
            className="bg-red-50 text-red-600 border-2 border-red-100 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-100 transition"
          >
            Exit Console
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card border-2 border-border p-6 rounded-3xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Active Reports</p>
            <p className="text-4xl font-black">{flags.length}</p>
          </div>
          <div className="bg-card border-2 border-border p-6 rounded-3xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Flagged Threads</p>
            <p className="text-4xl font-black">{flaggedPosts.length}</p>
          </div>
          <div className="bg-card border-2 border-border p-6 rounded-3xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Global Posts</p>
            <p className="text-4xl font-black">{posts.length}</p>
          </div>
        </div>

        <div className="bg-card border-2 border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b-2 border-border flex items-center justify-between bg-muted/10">
            <h2 className="font-black text-lg">Moderation Queue</h2>
            <button onClick={loadData} className="text-xs font-bold text-muted-foreground hover:text-foreground">Refresh Data</button>
          </div>

          <div className="divide-y-2 divide-border">
            {loading ? (
              <div className="p-20 text-center text-muted-foreground font-bold animate-pulse">Synchronizing with community database...</div>
            ) : flaggedPosts.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <span className="text-5xl mb-4">✨</span>
                <p className="text-xl font-black">All Clean!</p>
                <p className="text-muted-foreground mt-2">No pending reports in the community queue.</p>
              </div>
            ) : (
              flaggedPosts.map(({ post, reports }) => (
                <div key={post.id} className="p-8 hover:bg-muted/5 transition group">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                           {reports.length} Reports
                         </span>
                         <span className="font-black text-sm">{post.userName || post.name || "Anonymous"}</span>
                         <span className="text-xs text-muted-foreground">· ID: {post.id}</span>
                      </div>
                      
                      <div className="bg-muted/50 border-2 border-border p-4 rounded-2xl italic text-foreground/80 mb-4 text-sm font-medium">
                        "{post.text}"
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {reports.map(r => (
                          <div key={r.id} className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded-lg text-[10px] font-bold">
                            ⚠️ {r.reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 justify-center">
                      <button 
                        onClick={() => handleDismiss(post.id)}
                        className="flex-1 md:flex-none bg-green-500 text-white font-black px-6 py-3 rounded-xl text-sm hover:bg-green-600 shadow-lg shadow-green-500/20 transition active:scale-95"
                      >
                        Approve Content
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="flex-1 md:flex-none bg-red-500 text-white font-black px-6 py-3 rounded-xl text-sm hover:bg-red-600 shadow-lg shadow-red-500/20 transition active:scale-95"
                      >
                        Nuke Post
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
