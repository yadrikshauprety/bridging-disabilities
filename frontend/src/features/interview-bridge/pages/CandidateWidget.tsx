import * as React from "react";
import { supabase, type InterviewSession, type InterviewTranscript } from "../lib/supabase";
import { Mic, MicOff, MessageSquare, Video, Share2, Copy, X, Camera, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SIGN_MAP: Record<string, string> = {
  hi: "/dataset/Hello.mp4",
  hello: "/dataset/Hello.mp4",
  hey: "/dataset/Hello.mp4",
  welcome: "/dataset/Welcome_(Reply_to_Thanks).mp4",
  thanks: "/dataset/Thank_You_(Sign_2).mp4",
  thank: "/dataset/Thank_You_(Sign_2).mp4",
  work: "/dataset/Work.mp4",
  help: "/dataset/Help.mp4",
  interview: "/dataset/Interview.mp4",
  salary: "/dataset/Salary.mp4",
  experience: "/dataset/Experience.mp4",
  yes: "/dataset/Yes.mp4",
  happy: "/dataset/Happy.mp4",
  introduce: "/dataset/Introduce.mp4",
  yourself: "/dataset/Yourself.mp4",
};

/* ── Feature extraction helpers for Sign Detection ── */
function dist(a: any, b: any) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angle(a: any, b: any, c: any) {
  const ba = { x: a.x - b.x, y: a.y - b.y }, bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const cross = ba.x * bc.y - ba.y * bc.x;
  return Math.atan2(Math.abs(cross), dot);
}

function fingerFeatures(lm: any[], hs: number, mcpI: number, pipI: number, dipI: number, tipI: number) {
  const mcpP = lm[mcpI], pipP = lm[pipI], tipP = lm[tipI];
  const curl = angle(mcpP, pipP, tipP);
  const reach = dist(mcpP, tipP) / hs;
  return { curl, reach };
}

function classifyFrame(lm: any[]): string | null {
  if (!lm || lm.length < 21) return null;
  const wrist = lm[0];
  const hs = dist(lm[0], lm[9]) || 0.0001;

  const fi = [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  const fingers = fi.map(([m, p, d, t]) => fingerFeatures(lm, hs, m, p, d, t));
  const extended = fingers.map(f => f.curl > 0.85 && f.reach > 0.42);
  const [idxExt, midExt, ringExt, pinkExt] = extended;
  const extCount = extended.filter(Boolean).length;

  const thumbAboveWrist = (wrist.y - lm[4].y) / hs;

  const scores: Record<string, number> = {};
  scores["no"] = (extCount === 0 ? 4 : 0);
  scores["thumbs_up"] = (extCount === 0 ? 3 : 0) + (thumbAboveWrist > 0.3 ? 5 : 0);
  scores["yes"] = (extCount >= 4 ? 6 : 0);
  scores["point"] = (idxExt && !midExt && !ringExt && !pinkExt ? 6 : 0);

  let best: string | null = null, bestScore = 4;
  for (const [gesture, score] of Object.entries(scores)) {
    if (score > bestScore) { best = gesture; bestScore = score; }
  }
  return best;
}

const BUF = 15;

export function CandidateWidget({ sessionId }: { sessionId: string }) {
  const [session, setSession] = React.useState<InterviewSession | null>(null);
  const [tab, setTab] = React.useState<"main" | "sign" | "share" | "settings">("main");
  const [captions, setCaptions] = React.useState<string[]>([]);
  const [currentSign, setCurrentSign] = React.useState<string | null>(null);
  const [listening, setListening] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [detectedGesture, setDetectedGesture] = React.useState<string | null>(null);
  const [lang, setLang] = React.useState('en-IN');
  
  const recognitionRef = React.useRef<any>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const handsRef = React.useRef<any>(null);
  const bufRef = React.useRef<(string | null)[]>([]);

  const pipCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const pipVideoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.from("interview_sessions").select("*").eq("id", sessionId).single();
      if (data) setSession(data);
    };
    fetchSession();
  }, [sessionId]);

  // Mega-PiP: Render Avatar + Captions to Canvas
  React.useEffect(() => {
    const canvas = pipCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    let raf: number;
    const render = () => {
      ctx.fillStyle = "#020617"; // bg-slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Avatar
      const islVideo = document.getElementById("isl-video") as HTMLVideoElement;
      if (islVideo && !islVideo.paused) {
        ctx.drawImage(islVideo, 0, 0, canvas.width, canvas.height * 0.75);
      } else {
        ctx.fillStyle = "#1e293b"; // bg-slate-800
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height * 0.6);
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AVATAR READY", canvas.width / 2, canvas.height * 0.3);
      }

      // Draw Captions
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
      ctx.fillStyle = "white";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      const lastCaption = captions[captions.length - 1] || "Waiting for speech...";
      
      // Basic text wrapping
      const words = lastCaption.split(' ');
      let line = '';
      let y = canvas.height * 0.85;
      for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (testLine.length > 25 && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [captions]);

  const startMegaPip = async () => {
    const canvas = pipCanvasRef.current;
    const video = pipVideoRef.current;
    if (!canvas || !video) return;

    try {
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      await video.play();
      await (video as any).requestPictureInPicture();
    } catch (err) {
      toast.error("Floating mode failed. Try clicking Pop out Avatar instead.");
    }
  };

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setListening(true);
        toast.success(`Listening (${lang === 'en-IN' ? 'English' : 'Hindi'})...`);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error("Speech Error:", event.error);
          setListening(false);
        }
      };

      recognition.onresult = async (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript.trim().toLowerCase();
            
            // Keyword check
            const words = text.split(/\s+/);
            for (const word of words) {
              if (SIGN_MAP[word]) {
                setCurrentSign(SIGN_MAP[word]);
                break;
              }
            }

            // Cleanup captions
            try {
              const res = await fetch("http://localhost:5000/api/ml/cleanup-captions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
              });
              const data = await res.json();
              if (data.text) setCaptions(prev => [...prev.slice(-5), data.text]);
            } catch {
              setCaptions(prev => [...prev.slice(-5), text]);
            }
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      toast.error("Mic access failed.");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startDetecting = async () => {
    if (detecting) {
      setDetecting(false);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setDetecting(true);
      
      if (!(window as any).Hands) {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
        s.onload = initHands;
        document.head.appendChild(s);
      } else {
        initHands();
      }
    } catch (err) {
      toast.error("Camera failed.");
    }
  };

  const initHands = () => {
    const hands = new (window as any).Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    
    hands.onResults((results: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas || !videoRef.current) return;
      
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const lms = results.multiHandLandmarks?.[0];
      if (lms) {
        const g = classifyFrame(lms);
        bufRef.current = [...bufRef.current.slice(-(BUF - 1)), g];
        const counts: any = {};
        bufRef.current.forEach(x => { if (x) counts[x] = (counts[x] || 0) + 1; });
        let best = null, max = 0;
        for (const k in counts) if (counts[k] > max) { best = k; max = counts[k]; }
        if (max > BUF * 0.6) setDetectedGesture(best);
      }
      ctx.restore();
    });
    
    handsRef.current = hands;
    const loop = async () => {
      if (videoRef.current && detecting) {
        try { await hands.send({ image: videoRef.current }); } catch {}
        requestAnimationFrame(loop);
      }
    };
    loop();
  };

  React.useEffect(() => {
    if (detectedGesture) {
      const sendGesture = async () => {
        const text = detectedGesture === "yes" ? "Yes." : 
                     detectedGesture === "no" ? "No." : 
                     detectedGesture === "thumbs_up" ? "Confirmed." : 
                     "Candidate is pointing.";
        
        await supabase.from("interview_transcripts").insert({
          session_id: sessionId,
          sender: "candidate",
          text: text
        });
      };
      sendGesture();
      const timer = setTimeout(() => setDetectedGesture(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [detectedGesture, sessionId]);

  const copyEmployerLink = () => {
    const url = `${window.location.origin}/session/${sessionId}/employer`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  if (!session) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black animate-pulse">BRIDGE INITIALIZING...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white font-sans overflow-hidden border-2 border-white/5 rounded-3xl">
      {/* Hidden elements for Mega-PiP */}
      <canvas ref={pipCanvasRef} width={400} height={500} className="hidden" />
      <video ref={pipVideoRef} muted className="hidden" />

      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <div>
            <h1 className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">Bridge Live</h1>
            <p className="text-xs font-bold truncate max-w-[120px]">{session.job_title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setLang(lang === 'en-IN' ? 'hi-IN' : 'en-IN')}
            className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-black border border-white/5 hover:bg-white/10 transition"
          >
            {lang === 'en-IN' ? 'EN' : 'HI'}
          </button>
          <button 
            onClick={listening ? stopListening : startListening} 
            className={`p-2 rounded-lg transition ${listening ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-600/20'} shadow-lg`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main View */}
      <main className="flex-1 relative overflow-hidden flex flex-col p-3 space-y-3">
        <div className="relative flex-1 bg-slate-900 rounded-2xl border-2 border-white/5 overflow-hidden shadow-inner flex flex-col">
          {/* Avatar Video Area */}
          <div className="flex-1 relative">
            {currentSign ? (
              <video 
                id="isl-video" 
                key={currentSign} 
                src={currentSign} 
                autoPlay 
                onEnded={() => setCurrentSign(null)} 
                className="w-full h-full object-contain bg-black" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                <Video className="w-12 h-12 mb-2 opacity-10" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Waiting for Speech</p>
              </div>
            )}

            {/* Gesture Detection Overlay */}
            {tab === "sign" && (
              <div className="absolute top-3 left-3 w-32 aspect-video bg-black border border-white/20 rounded-lg overflow-hidden shadow-2xl">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-0" />
                <canvas ref={canvasRef} className="w-full h-full object-cover" width={128} height={72} />
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
               <button 
                onClick={startMegaPip}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full border border-white/20 transition shadow-lg"
                title="Float over everything (Mega-PiP)"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Captions Area */}
          <div className="bg-slate-950/90 backdrop-blur p-4 border-t border-white/5 min-h-[100px] flex flex-col justify-end">
             <div className="space-y-1">
               {captions.slice(-2).map((c, i) => (
                 <p key={i} className={`text-sm leading-tight font-black transition-all ${i === captions.slice(-2).length - 1 ? 'text-white' : 'text-white/30'}`}>
                   {c}
                 </p>
               ))}
               {captions.length === 0 && <p className="text-slate-600 text-center italic text-[10px]">Captions appear here...</p>}
             </div>
          </div>
        </div>

        {/* Share Link Overlay */}
        <AnimatePresence>
          {tab === "share" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute inset-x-3 bottom-20 bg-blue-600 rounded-2xl p-4 shadow-2xl z-20">
               <div className="flex items-center gap-3">
                 <div className="bg-white p-1 rounded-lg shrink-0"><QRCodeSVG value={`${window.location.origin}/session/${sessionId}/employer`} size={50} /></div>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Employer Link</p>
                   <button onClick={copyEmployerLink} className="w-full bg-white text-blue-600 text-[10px] font-black py-2 rounded-lg hover:bg-blue-50 transition uppercase flex items-center justify-center gap-1">
                     <Copy className="w-3 h-3" /> Copy Link
                   </button>
                 </div>
                 <button onClick={() => setTab("main")} className="p-1 hover:bg-blue-500 rounded-full"><X className="w-4 h-4" /></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Nav */}
      <nav className="px-4 py-3 bg-slate-900/80 border-t border-white/5 flex justify-between items-center shrink-0">
        <button onClick={() => setTab("main")} className={`p-2 rounded-xl transition ${tab === "main" ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Main View">
          <MessageSquare className="w-5 h-5" />
        </button>
        <button onClick={startDetecting} className={`p-2 rounded-xl transition ${detecting ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Sign Detection">
          <Camera className="w-5 h-5" />
        </button>
        <button onClick={() => setTab("share")} className={`p-2 rounded-xl transition ${tab === "share" ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Share Link">
          <Share2 className="w-5 h-5" />
        </button>
        <button onClick={() => setTab("settings" as any)} className={`p-2 rounded-xl transition ${tab === ("settings" as any) ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Preview Camera">
          <Video className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}
