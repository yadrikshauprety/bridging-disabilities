import * as React from "react";
import { supabase, type InterviewSession, type InterviewTranscript } from "../lib/supabase";
import { Plus, Minus, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function EmployerCaptionView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = React.useState<InterviewSession | null>(null);
  const [transcripts, setTranscripts] = React.useState<InterviewTranscript[]>([]);
  const [fontSize, setFontSize] = React.useState(32);
  const [highContrast, setHighContrast] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.from("interview_sessions").select("*").eq("id", sessionId).single();
      if (data) setSession(data);
    };
    fetchSession();

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("interview_transcripts")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setTranscripts(data.reverse());
    };
    fetchInitial();

    const channel = supabase
      .channel(`employer-view-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "interview_transcripts",
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setTranscripts(prev => [...prev.slice(-9), payload.new as InterviewTranscript]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (!session) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.2em]">Connecting to Bridge...</div>;

  return (
    <div className={`h-screen flex flex-col ${highContrast ? 'bg-black text-yellow-400' : 'bg-slate-950 text-white'} transition-colors duration-500 font-sans`}>
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-slate-900/50">
        <div>
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-blue-500">🤟</span> INTERVIEW CAPTIONS
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Session: {session.candidate_name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-800/50 rounded-full p-1 border border-white/10">
            <button onClick={() => setFontSize(s => Math.max(24, s - 4))} className="p-2 hover:bg-slate-700 rounded-full transition"><Minus className="w-4 h-4" /></button>
            <span className="px-3 text-xs font-black min-w-[50px] text-center">{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(80, s + 4))} className="p-2 hover:bg-slate-700 rounded-full transition"><Plus className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={() => setHighContrast(!highContrast)}
            className={`p-3 rounded-full transition ${highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'}`}
            title="Toggle High Contrast"
          >
            <Type className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-12 flex flex-col justify-end space-y-8">
        <div className="max-w-5xl mx-auto w-full">
          <AnimatePresence initial={false}>
            {transcripts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-600 italic">
                Waiting for candidate signs...
              </motion.div>
            ) : (
              transcripts.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: i === transcripts.length - 1 ? 1 : 0.3, 
                    y: 0,
                    scale: i === transcripts.length - 1 ? 1 : 0.98
                  }}
                  className="font-black leading-tight mb-8"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <span className="text-blue-500 opacity-60 mr-4 font-mono text-sm uppercase">[{new Date(t.created_at).toLocaleTimeString()}]</span>
                  {t.text}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-white/10 bg-slate-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Translation Active</span>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase">
          DisabilityBridge — Real-time ISL Engine
        </div>
      </footer>
    </div>
  );
}
