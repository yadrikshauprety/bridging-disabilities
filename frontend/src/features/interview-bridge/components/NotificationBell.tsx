import * as React from "react";
import { Bell, Check, ExternalLink, Copy, Calendar } from "lucide-react";
import { supabase, type Notification } from "../lib/supabase";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (data) setNotifications(data);
    };

    fetchNotifications();

    // Realtime subscription - Use a unique channel name per user to avoid collisions
    const channelName = `notifications-${userId}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          toast.info("New Notification", {
            description: payload.new.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const copyLink = (sessionId: string) => {
    const url = `${window.location.origin}/session/${sessionId}/candidate`;
    navigator.clipboard.writeText(url);
    toast.success("Candidate link copied to clipboard!");
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="p-2 rounded-full hover:bg-gray-100 transition relative"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-sm text-gray-900">Interview Sessions</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No sessions scheduled yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-gray-50 transition hover:bg-gray-50 ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <p className="text-sm font-semibold text-gray-800 mb-1">{n.message}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* If message contains a link, show Join Meeting button */}
                        {n.message.includes("http") && (
                          <button
                            onClick={() => {
                              // Refined regex to exclude trailing punctuation like periods
                              const link = n.message.match(/https?:\/\/[^\s]+(?<![.!,?])/)?.[0];
                              if (link) window.open(link, '_blank');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            <Calendar className="w-3 h-3" />
                            Join Meeting
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const url = `/session/${n.session_id}/candidate`;
                            const w = 400;
                            const h = 700;
                            const left = (window.screen.width / 2) - (w / 2);
                            const top = (window.screen.height / 2) - (h / 2);
                            window.open(url, 'InterviewBridge', `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=no,status=no,location=no,toolbar=no,menubar=no`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Bridge
                        </button>
                        <button
                          onClick={() => copyLink(n.session_id)}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 text-xs font-bold py-2 px-3 rounded-lg hover:bg-slate-200 transition"
                          title="Copy Link for Employer"
                        >
                          <Copy className="w-3 h-3" />
                          Share Link
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-gray-50 text-center">
                <button 
                  onClick={() => navigate({ to: '/employer' as any })}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 transition"
                >
                  View all interviews
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
