import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Sign Language Interview — DisabilityBridge" }] }),
  component: InterviewPage,
});

type EmployerQ = { q: string; expects: string[]; hint: string };

/* ── ISL gesture vocabulary ── */
const SIGNS: Record<string, { label: string; emoji: string; fingers: string; phrase: string }> = {
  yes:       { label:"Open Palm",     emoji:"🖐️", fingers:"All 5 fingers open, palm facing forward", phrase:"Yes." },
  no:        { label:"Fist",          emoji:"✊",  fingers:"All fingers curled into a closed fist", phrase:"No." },
  thumbs_up: { label:"Thumbs Up",     emoji:"👍", fingers:"Thumb pointing up, all other fingers closed", phrase:"Yes, I am confident." },
  thumbs_down:{ label:"Thumbs Down",  emoji:"👎", fingers:"Thumb pointing down, all other fingers closed", phrase:"I'm not sure / No." },
  point:     { label:"One / Point",   emoji:"☝️", fingers:"Only index finger pointing up", phrase:"One / Let me explain." },
  peace:     { label:"Two",           emoji:"✌️", fingers:"Index + middle up, others folded", phrase:"Two." },
  three:     { label:"Three",         emoji:"3️⃣", fingers:"Index + middle + ring up, others folded", phrase:"Three." },
  four:      { label:"Four",          emoji:"4️⃣", fingers:"All 4 fingers up, thumb folded", phrase:"Four." },
  ok:        { label:"OK Sign",       emoji:"👌", fingers:"Thumb + index form a circle, other 3 extended", phrase:"I understand and agree." },
  call_me:   { label:"Call Me",       emoji:"🤙", fingers:"Thumb + pinky extended, other 3 folded", phrase:"I am available and flexible." },
  ily:       { label:"I Love You",    emoji:"🤟", fingers:"Thumb + index + pinky up, middle + ring folded", phrase:"Thank you for this opportunity." },
  stop:      { label:"Stop / Five",   emoji:"🤚", fingers:"All fingers extended and spread wide", phrase:"Five / I have a concern." },
};

/* ── Sentence composer: gesture sequences → natural sentences ── */
const SEQUENCE_MAP: Record<string, string> = {
  // Single signs
  "yes":               "Yes, I can do that.",
  "no":                "No, that would not work for me.",
  "thumbs_up":         "Yes, I am confident I can handle this role.",
  "thumbs_down":       "I'm not fully sure, but I'm willing to learn.",
  "point":             "Let me explain my background in detail.",
  "peace":             "I have two years of relevant experience.",
  "three":             "I have three years of experience in this area.",
  "four":              "I have four years of experience.",
  "ok":                "I completely understand and I agree.",
  "call_me":           "I am fully available and flexible with timing.",
  "ily":               "Thank you so much for this opportunity.",
  "stop":              "I have a question or concern I would like to raise.",
  // Two-sign combos
  "yes,thumbs_up":     "Yes, absolutely — I am very confident about this.",
  "yes,peace":         "Yes, and I bring two years of experience to this role.",
  "yes,three":         "Yes, I have three years of hands-on experience.",
  "yes,point":         "Yes, and let me explain why I am the right fit.",
  "yes,ok":            "Yes, I understand all the requirements clearly.",
  "yes,call_me":       "Yes, I am available and ready to start soon.",
  "yes,ily":           "Yes, and I am truly grateful for this chance.",
  "thumbs_up,point":   "I'm confident, and I'd like to explain my approach.",
  "thumbs_up,peace":   "I'm confident — I have two years of solid experience.",
  "peace,thumbs_up":   "With two years of experience, I am very confident.",
  "three,thumbs_up":   "With three years of experience, I am confident.",
  "four,thumbs_up":    "With four years of experience, I am very confident.",
  "point,ily":         "Let me explain — I am deeply grateful for this opportunity.",
  "ok,thumbs_up":      "I understand completely and I am very confident.",
  "no,point":          "No, but let me explain my alternative approach.",
  "no,ok":             "No, but I understand and respect the requirement.",
  // Introduction sequences (for "introduce yourself" questions)
  "thumbs_up,peace,point":  "I am a confident candidate with two years of experience — let me explain.",
  "thumbs_up,three,point":  "I am confident, with three years of experience — let me explain.",
  "peace,ok":          "I have two years of experience and I understand the role well.",
  "three,ok":          "I have three years of experience and I understand the requirements.",
  "point,peace":       "Let me explain — I have two years of experience.",
  "point,three":       "Let me explain — I have three years of experience.",
  "point,four":        "Let me explain — I have four years of experience.",
  "call_me,yes":       "I am available and ready to start immediately.",
  "ily,thumbs_up":     "Thank you — I am very confident about this opportunity.",
  "point,yes,ily":     "Let me explain — yes, I can do it, and thank you for the chance.",
};

const DEFAULT_QUESTIONS: EmployerQ[] = [
  { q:"Please introduce yourself briefly.",
    expects:["point","thumbs_up","peace","three","four"],
    hint:"☝️ Point = Let me explain  •  ✌️ = 2 yrs  •  3️⃣ = 3 yrs  •  👍 = Confident. Combine them!" },
  { q:"Are you comfortable with this role?",            expects:["yes","no"],           hint:"🖐️ Open palm = Yes  •  ✊ Fist = No" },
  { q:"Can you start within two weeks?",                expects:["yes","no","call_me"], hint:"🖐️ Yes  •  ✊ No  •  🤙 I'm flexible" },
  { q:"Are you confident you can handle this work?",    expects:["thumbs_up","no"],     hint:"👍 Thumbs up = Confident  •  ✊ No" },
  { q:"How many years of experience do you have?",      expects:["point","peace","three","four","stop"], hint:"☝️ 1  •  ✌️ 2  •  3️⃣ 3  •  4️⃣ 4  •  🤚 5 years" },
  { q:"Would you like to explain your last project?",   expects:["point","yes","no"],   hint:"☝️ Point = Let me explain" },
  { q:"Do you have any concerns about the role?",       expects:["stop","ok","no"],     hint:"🤚 Stop = I have a concern  •  👌 OK = All good" },
  { q:"Any final words for the panel?",                 expects:["ily","thumbs_up"],    hint:"🤟 ILY = Thank you  •  👍 Thumbs up = Great" },
];

type LM = { x:number; y:number; z:number };

/* ── Feature extraction helpers ── */
function dist(a:LM, b:LM) { return Math.hypot(a.x-b.x, a.y-b.y); }
function dist3(a:LM, b:LM) { return Math.hypot(a.x-b.x, a.y-b.y, (a.z-b.z)*0.5); }
function angle(a:LM, b:LM, c:LM) {
  const ba = {x:a.x-b.x, y:a.y-b.y}, bc = {x:c.x-b.x, y:c.y-b.y};
  const dot = ba.x*bc.x + ba.y*bc.y;
  const cross = ba.x*bc.y - ba.y*bc.x;
  return Math.atan2(Math.abs(cross), dot);
}

/* ── Per-finger feature vector ── */
function fingerFeatures(lm:LM[], hs:number, mcpI:number, pipI:number, dipI:number, tipI:number) {
  const mcpP=lm[mcpI], pipP=lm[pipI], tipP=lm[tipI];
  const curl = angle(mcpP, pipP, tipP);          // low = curled, high = straight
  const extension = (mcpP.y - tipP.y) / hs;      // positive = tip above mcp (extended upward)
  const reach = dist(mcpP, tipP) / hs;            // far from mcp = extended
  return { curl, extension, reach };
}

/* ── Multi-feature gesture classifier ──
   Uses angular curl + extension + reach for every finger.
   Thumb uses 3 independent checks to avoid the classic thumbs_up/fist confusion.
*/
function classifyFrame(lm: LM[]): string | null {
  if (!lm || lm.length < 21) return null;
  const wrist = lm[0];
  const hs = dist(lm[0], lm[9]) || 0.0001;

  // ── Finger features ──
  // Thumb: landmarks 1(CMC), 2(MCP), 3(IP), 4(TIP)
  const thumbCurl   = angle(lm[1], lm[2], lm[4]);
  const thumbReach  = dist(lm[4], lm[2]) / hs;
  const thumbAbduct = dist(lm[4], lm[5]) / hs;     // distance from thumb tip to index MCP
  const thumbAboveWrist = (wrist.y - lm[4].y) / hs; // positive = thumb is above wrist
  const thumbBelowWrist = (lm[4].y - wrist.y) / hs; // positive = thumb is below wrist
  const thumbAwayFromPalm = dist(lm[4], lm[9]) / hs;
  // Is the thumb really sticking out vs tucked into the fist?
  const thumbExtended = (thumbCurl > 0.9 && thumbReach > 0.55) ||
                        (thumbAbduct > 0.7) ||
                        (thumbAboveWrist > 0.4 && thumbReach > 0.45);

  // Other 4 fingers: check extension via curl angle + reach + vertical position
  const fi = [ // [mcp, pip, dip, tip] indices
    [5,  6,  7,  8],   // index
    [9,  10, 11, 12],  // middle
    [13, 14, 15, 16],  // ring
    [17, 18, 19, 20],  // pinky
  ];
  const fingers = fi.map(([m,p,d,t]) => fingerFeatures(lm, hs, m, p, d, t));
  // A finger is "extended" if curl angle > 1.2 rad (~69°) AND reach is decent
  // Lowered thresholds for better real-world accuracy
  const extended = fingers.map(f => f.curl > 0.85 && f.reach > 0.42);
  const [idxExt, midExt, ringExt, pinkExt] = extended;
  const extCount = extended.filter(Boolean).length;

  // ── Score each gesture (higher = more likely) ──
  const scores: Record<string, number> = {};

  // FIST (no): all fingers curled, thumb tucked close to palm
  scores["no"] = 0;
  if (extCount === 0) scores["no"] += 4;
  if (!thumbExtended) scores["no"] += 3;
  if (thumbAbduct < 0.5) scores["no"] += 2; // thumb close to index = tucked
  if (thumbReach < 0.5) scores["no"] += 1;

  // THUMBS UP: thumb clearly extended upward, all 4 fingers curled
  scores["thumbs_up"] = 0;
  if (extCount === 0) scores["thumbs_up"] += 3;   // 4 fingers must be curled
  if (thumbAboveWrist > 0.3) scores["thumbs_up"] += 3; // thumb above wrist
  if (thumbCurl > 1.0) scores["thumbs_up"] += 2;  // thumb is straight
  if (thumbReach > 0.5) scores["thumbs_up"] += 2;
  if (thumbAbduct > 0.5) scores["thumbs_up"] += 1; // thumb away from fingers
  if (thumbAwayFromPalm > 0.7) scores["thumbs_up"] += 2;
  // Penalty if thumb is tucked
  if (thumbAbduct < 0.35) scores["thumbs_up"] -= 4;
  if (thumbAboveWrist < 0.1) scores["thumbs_up"] -= 2;

  // THUMBS DOWN: thumb pointing below wrist
  scores["thumbs_down"] = 0;
  if (extCount === 0) scores["thumbs_down"] += 3;
  if (thumbBelowWrist > 0.4) scores["thumbs_down"] += 4;
  if (thumbCurl > 0.9) scores["thumbs_down"] += 2;
  if (thumbReach > 0.5) scores["thumbs_down"] += 1;

  // OPEN PALM (yes): all 5 extended
  scores["yes"] = 0;
  if (extCount >= 4) scores["yes"] += 4;
  if (thumbExtended) scores["yes"] += 3;
  if (thumbAbduct > 0.5) scores["yes"] += 1;

  // POINT: only index finger
  scores["point"] = 0;
  if (idxExt && !midExt && !ringExt && !pinkExt) scores["point"] += 6;
  if (!thumbExtended) scores["point"] += 1;

  // PEACE: index + middle only
  scores["peace"] = 0;
  if (idxExt && midExt && !ringExt && !pinkExt) scores["peace"] += 6;
  if (!thumbExtended) scores["peace"] += 1;

  // THREE: index + middle + ring
  scores["three"] = 0;
  if (idxExt && midExt && ringExt && !pinkExt) scores["three"] += 6;

  // FOUR: all 4 fingers up, thumb folded
  scores["four"] = 0;
  if (idxExt && midExt && ringExt && pinkExt && !thumbExtended) scores["four"] += 7;

  // ILY: thumb + index + pinky (middle + ring curled)
  scores["ily"] = 0;
  if (idxExt && !midExt && !ringExt && pinkExt) scores["ily"] += 4;
  if (thumbExtended) scores["ily"] += 3;

  // CALL ME: thumb + pinky (others curled)
  scores["call_me"] = 0;
  if (!idxExt && !midExt && !ringExt && pinkExt) scores["call_me"] += 4;
  if (thumbExtended) scores["call_me"] += 3;

  // OK: thumb tip touching index tip, other 3 extended
  const okDist = dist(lm[4], lm[8]) / hs;
  scores["ok"] = 0;
  if (okDist < 0.2) scores["ok"] += 5;
  if (midExt && ringExt && pinkExt) scores["ok"] += 3;

  // STOP: all fingers spread wide
  scores["stop"] = 0;
  if (extCount >= 3) scores["stop"] += 2;
  if (thumbExtended) scores["stop"] += 1;
  // Measure spread between fingers
  const spread = (dist(lm[8], lm[20]) / hs);
  if (spread > 1.0 && extCount >= 4) scores["stop"] += 3;

  // ── Pick highest-scoring gesture ──
  let best: string | null = null, bestScore = 3; // minimum threshold of 3
  for (const [gesture, score] of Object.entries(scores)) {
    if (score > bestScore) { best = gesture; bestScore = score; }
  }
  return best;
}

const BUF = 25;
function majority(buf:(string|null)[]): {g:string|null; ratio:number} {
  const c:Record<string,number>={};
  for (const x of buf) { if(x) c[x]=(c[x]||0)+1; }
  let best:string|null=null, bestN=0;
  for (const [k,v] of Object.entries(c)) if(v>bestN){best=k;bestN=v;}
  return {g:best, ratio:bestN/BUF};
}

function loadScript(src:string):Promise<void> {
  return new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)) return res();
    const s=document.createElement("script");
    s.src=src; s.crossOrigin="anonymous";
    s.onload=()=>res(); s.onerror=()=>rej();
    document.head.appendChild(s);
  });
}

const CONNECTIONS:[number,number][]=[
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17],
];

/* ── Component ── */
function InterviewPage() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number|null>(null);
  const bufRef = useRef<(string|null)[]>([]);
  const frameCountRef = useRef(0);
  const streamRef = useRef<MediaStream|null>(null);
  const lastEmitRef = useRef<{g:string;ts:number}>({g:"",ts:0});
  const seqRef = useRef<string[]>([]); // gesture sequence buffer

  const [questions, setQuestions] = useState<EmployerQ[]>(DEFAULT_QUESTIONS);
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string|null>(null);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState<{q:string;a:string;signs:string[]}[]>([]);
  const [seqDisplay, setSeqDisplay] = useState<string[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [jobContext, setJobContext] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const pausedRef = useRef(false); // pause detection between questions
  const [analyzing, setAnalyzing] = useState(false);
  const framesRef = useRef<any[]>([]);

  async function analyzeWithAI() {
    if (!framesRef.current.length) return;
    setAnalyzing(true);
    a11y.speak("Analyzing your sign sequence with AI...", "system");
    try {
      const res = await fetch("/api/ml/recognize-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarks: framesRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        a11y.speak(`AI detected: ${data.transcript}`, "assistant");
        const q = questions[active];
        setTranscript(t => [...t, { q: q?.q || "—", a: data.transcript, signs: ["AI Transformer"] }]);
        clearSequence();
        framesRef.current = [];
      }
    } catch (err) {
      console.error(err);
    }
    setAnalyzing(false);
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const jobId=params.get("jobId");
    if(!jobId) return;
    fetch(`/api/jobs/${jobId}`)
      .then(r=>r.ok?r.json():null)
      .then(job=>{
        if(!job) return;
        setJobContext(job);
        if(job.questions?.length>0) {
          setQuestions(job.questions.map((q:any)=>({
            q:typeof q==="string"?q:q.q,
            expects:q.expects??["yes","no"],
            hint:q.hint??"🖐️ Open palm = Yes  •  ✊ Fist = No",
          })));
        }
      }).catch(()=>{});
  },[]);

  const onResults = useCallback((results:any)=>{
    const canvas=canvasRef.current, video=videoRef.current;
    if(!canvas||!video) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    const W=video.videoWidth||480, H=video.videoHeight||360;
    canvas.width=W; canvas.height=H;
    ctx.save();
    ctx.translate(W,0); ctx.scale(-1,1);
    ctx.drawImage(video,0,0,W,H);
    const lms=results?.multiHandLandmarks??[];
    let frameG:string|null=null;
    for(const hand of lms) {
      ctx.strokeStyle="rgba(0,230,200,.9)"; ctx.lineWidth=2;
      ctx.beginPath();
      for(const [a,b] of CONNECTIONS){ctx.moveTo(hand[a].x*W,hand[a].y*H);ctx.lineTo(hand[b].x*W,hand[b].y*H);}
      ctx.stroke();
      ctx.fillStyle="#fff";
      for(const p of hand){ctx.beginPath();ctx.arc(p.x*W,p.y*H,3,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="rgba(0,230,200,1)";
      for(const t of[4,8,12,16,20]){ctx.beginPath();ctx.arc(hand[t].x*W,hand[t].y*H,6,0,Math.PI*2);ctx.fill();}
      frameG = classifyFrame(hand);
      
      // Store landmarks for transformer bridge (limit to 300 frames = ~10s)
      if (!pausedRef.current && framesRef.current.length < 300) {
        framesRef.current.push(hand);
      }
    }
    ctx.restore();
    bufRef.current=[...bufRef.current.slice(-(BUF-1)),frameG];
    const {g,ratio}=majority(bufRef.current);
    setCurrentGesture(g); setConfidence(ratio);
    // Lock a sign when stable + cooldown — but only if not paused between questions
    if(g&&ratio>=0.55&&!pausedRef.current){
      const now=Date.now();
      if(g!==lastEmitRef.current.g||now-lastEmitRef.current.ts>2500){
        lastEmitRef.current={g,ts:now};
        addToSequence(g);
      }
    }
  },[]);

  function addToSequence(g:string) {
    seqRef.current=[...seqRef.current,g].slice(-4);
    setSeqDisplay([...seqRef.current]);
    // NO auto-commit — user must click Confirm manually
  }

  function clearSequence() {
    seqRef.current=[]; setSeqDisplay([]);
    lastEmitRef.current={g:"",ts:0};
  }

  function confirmAnswer() {
    const seq=seqRef.current; if(!seq.length) return;
    const key=seq.join(",");
    const sentence=SEQUENCE_MAP[key]??SEQUENCE_MAP[seq[seq.length-1]]??SIGNS[seq[seq.length-1]]?.phrase??"Detected.";
    const q=questions[active];
    setTranscript(t=>[...t,{q:q?.q??"—",a:sentence,signs:[...seq]}]);
    seqRef.current=[]; setSeqDisplay([]);
    lastEmitRef.current={g:"",ts:0};
    bufRef.current=[];
    setCurrentGesture(null); setConfidence(0);
    // PAUSE detection so signs don't bleed into next question
    pausedRef.current = true;
    // Auto-advance to next question after a pause
    if(active<questions.length-1){
      setTimeout(()=>{
        setActive(prev=>{
          const n=prev+1;
          return n;
        });
        // Resume detection after advancing
        setTimeout(()=>{ pausedRef.current = false; bufRef.current=[]; },800);
      },2000);
    } else {
      pausedRef.current = false;
    }
  }

  async function startCamera() {
    setError(null); setLoading(true);
    try {
      if(!(window as any).Hands) {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      }
      const stream=await navigator.mediaDevices.getUserMedia({video:{width:480,height:360},audio:false});
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
      setStreaming(true); setLoading(false);
      a11y.speak("Camera started.","assistant");
    } catch(e:any){ setError(e?.message||"Camera denied."); setLoading(false); }
  }

  function stopCamera() {
    stopDetecting();
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current=null;
    if(videoRef.current){videoRef.current.pause();videoRef.current.srcObject=null;}
    const canvas=canvasRef.current;
    if(canvas){const ctx=canvas.getContext("2d");ctx?.clearRect(0,0,canvas.width,canvas.height);}
    setStreaming(false);
  }

  useEffect(()=>()=>{stopCamera();},[]);

  function startDetecting() {
    if(!streaming||(window as any).Hands==null) return;
    const hands=new (window as any).Hands({locateFile:(f:string)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.65,minTrackingConfidence:0.5});
    hands.onResults(onResults);
    handsRef.current=hands;
    bufRef.current=[]; frameCountRef.current=0;
    const loop=async()=>{
      if(videoRef.current&&videoRef.current.readyState>=2){
        frameCountRef.current++;
        if(frameCountRef.current%2===0) try{await hands.send({image:videoRef.current});}catch{}
      }
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    setDetecting(true);
    a11y.speak("Detection on.","assistant");
  }

  function stopDetecting() {
    if(rafRef.current){cancelAnimationFrame(rafRef.current);rafRef.current=null;}
    try{handsRef.current?.close?.();}catch{}
    handsRef.current=null;
    setDetecting(false); setCurrentGesture(null); setConfidence(0);
    bufRef.current=[]; seqRef.current=[]; setSeqDisplay([]);
  }

  async function submitInterview() {
    try {
      await fetch("/api/interviews",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({jobId:jobContext?.id??"unknown",candidateId:"pwd_candidate_1",employerId:jobContext?.employerId??"emp_1",transcript}),
      });
      setSubmitted(true);
      a11y.speak("Interview submitted.","system");
      setTimeout(()=>navigate({to:"/app/jobs"}),2000);
    } catch { setError("Submit failed."); }
  }

  const done=transcript.length>=questions.length&&questions.length>0;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <header>
        <h1 className="text-3xl font-black">🤟 Sign Language Interview</h1>
        <p className="text-sm text-muted-foreground">Sign 1–3 gestures in sequence — the system composes them into a full sentence. Each sign held for ~1 second locks in.</p>
        {jobContext&&<div className="mt-2 inline-flex gap-2 items-center px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-xl text-sm font-bold"><span className="text-primary">{jobContext.title}</span><span className="text-muted-foreground">@ {jobContext.company}</span></div>}
      </header>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-5">
        {/* Camera + controls */}
        <div className="space-y-4">
          <section className="rounded-2xl border-2 border-border bg-card p-5">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0"/>
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"/>
              {!streaming&&<div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                <span className="text-6xl">📷</span>
                <p className="font-bold">{loading?"Loading MediaPipe…":"Camera off"}</p>
              </div>}
              {detecting&&<div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-black rounded animate-pulse">● DETECTING</div>}
              {currentGesture&&<div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 text-sm font-black rounded">
                {SIGNS[currentGesture]?.emoji} {SIGNS[currentGesture]?.label} · {Math.round(confidence*100)}%
              </div>}
              {seqDisplay.length>0&&<div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 flex-wrap px-2">
                {seqDisplay.map((g,i)=><span key={i} className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">{SIGNS[g]?.emoji} {SIGNS[g]?.label}</span>)}
                <span className="bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold">Click ✓ Confirm below when ready</span>
              </div>}
            </div>

            {detecting&&<div className="mb-3">
              <div className="text-xs font-bold text-muted-foreground mb-1">Stability {Math.round(confidence*100)}% — need 55% to lock sign</div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full transition-all duration-150 ${confidence>=0.55?"bg-green-500":"bg-primary"}`} style={{width:`${Math.min(100,confidence*100)}%`}}/>
              </div>
            </div>}

            {error&&<p className="text-sm font-bold text-red-500 bg-red-50 rounded-xl p-3 mb-3">⚠ {error}</p>}

            <div className="flex flex-wrap gap-2">
              {!streaming?<button onClick={startCamera} disabled={loading} className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-2 disabled:opacity-50">▶ Start Camera</button>
                :<button onClick={stopCamera} className="rounded-xl border-2 border-border font-bold px-5 py-2">⏹ Stop Camera</button>}
              <button onClick={()=>detecting?stopDetecting():startDetecting()} disabled={!streaming} aria-pressed={detecting}
                className={`rounded-xl border-2 font-bold px-5 py-2 disabled:opacity-50 ${detecting?"bg-red-600 text-white border-red-600":"border-primary hover:bg-primary hover:text-primary-foreground"}`}>
                {detecting?"⏹ Stop Detecting":"🤟 Start Detecting"}
              </button>
              <button onClick={()=>setShowGuide(g=>!g)} className="rounded-xl border-2 border-border font-bold px-5 py-2 text-sm">
                {showGuide?"Hide":"📖 Sign Guide"}
              </button>
              <button 
                onClick={analyzeWithAI} 
                disabled={analyzing || !streaming} 
                className={`rounded-xl border-2 border-primary font-black px-5 py-2 text-sm transition-all ${analyzing ? "bg-primary/20 animate-pulse" : "bg-primary text-primary-foreground hover:shadow-lg"}`}
              >
                {analyzing ? "🤖 Analyzing..." : "🤖 AI Sentence Analysis"}
              </button>
            </div>

            {/* Manual confirm/clear/next controls */}
            {seqDisplay.length>0&&(
              <div className="flex gap-2 mt-3">
                <button onClick={confirmAnswer}
                  className="flex-1 rounded-xl bg-green-600 text-white font-black py-3 hover:bg-green-700 transition text-sm">
                  ✓ Confirm Answer ({seqDisplay.map(g=>SIGNS[g]?.emoji).join(" + ")})
                </button>
                <button onClick={clearSequence}
                  className="rounded-xl border-2 border-border font-bold px-5 py-3 hover:bg-muted transition text-sm">
                  ✕ Clear
                </button>
              </div>
            )}
            {transcript.length>0&&transcript.length===active+1&&active<questions.length-1&&!seqDisplay.length&&(
              <div className="w-full mt-3 rounded-xl bg-primary/10 border-2 border-primary/30 text-primary font-bold py-3 text-center text-sm animate-pulse">
                ⏳ Moving to Q{active+2} in a moment…
              </div>
            )}
          </section>

          {/* Current Q */}
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-5">
            <p className="text-xs font-bold text-primary uppercase mb-1">Question {Math.min(active+1,questions.length)} / {questions.length}</p>
            <p className="font-bold text-lg">{done?"✅ All answered!":questions[active]?.q}</p>
            {!done&&<p className="text-xs text-muted-foreground mt-2">{questions[active]?.hint}</p>}
            {seqDisplay.length>0&&<div className="mt-3 space-y-2">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs font-bold text-muted-foreground">Signs queued:</span>
                {seqDisplay.map((g,i)=><span key={i} className="inline-flex items-center gap-1 bg-background rounded-lg px-2 py-1 text-sm font-bold border border-border">{SIGNS[g]?.emoji} {SIGNS[g]?.label}</span>)}
              </div>
              <p className="text-xs text-primary font-bold">→ Preview: "{SEQUENCE_MAP[seqDisplay.join(",")]??SIGNS[seqDisplay[seqDisplay.length-1]]?.phrase??"..."}</p>
            </div>}
          </div>

          {/* Transcript */}
          <div className="rounded-2xl border-2 border-border bg-card p-5">
            <h3 className="font-black text-sm uppercase text-muted-foreground mb-3">📄 Transcript</h3>
            <div aria-live="polite" className="rounded-xl bg-muted p-4 max-h-56 overflow-y-auto space-y-3 min-h-[80px]">
              {transcript.length===0?<p className="text-sm italic text-muted-foreground">Answers appear here after each sign sequence…</p>
                :transcript.map((t,i)=>(
                  <div key={i} className="space-y-1">
                    <div className="flex gap-1 items-center">
                      <p className="text-xs text-muted-foreground flex-1">Q{i+1}: {t.q}</p>
                      <div className="flex gap-1">{t.signs.map((s,j)=><span key={j} className="text-sm" title={SIGNS[s]?.label}>{SIGNS[s]?.emoji}</span>)}</div>
                    </div>
                    <p className="font-bold text-sm bg-background rounded-lg px-3 py-2">💬 {t.a}</p>
                  </div>
                ))}
            </div>
            {done&&!submitted&&<button onClick={submitInterview} className="mt-3 w-full rounded-xl bg-green-600 text-white font-black py-3 hover:bg-green-700 transition">✓ Submit to Employer</button>}
            {submitted&&<div className="mt-3 w-full rounded-xl bg-green-100 text-green-800 font-black py-3 text-center">✅ Submitted! Returning to jobs…</div>}
          </div>
        </div>

        {/* Right panel: Questions + Sign Guide */}
        <div className="space-y-4">
          <section className="rounded-2xl border-2 border-border bg-card p-5">
            <h2 className="font-black text-lg mb-3">📋 Questions</h2>
            <div className="space-y-2">
              {questions.map((q,i)=>(
                <button key={i} onClick={()=>{ setActive(i);bufRef.current=[];seqRef.current=[];setSeqDisplay([]);lastEmitRef.current={g:"",ts:0};}}
                  className={`w-full text-left rounded-xl border-2 p-3 transition text-sm ${i===active?"border-primary bg-primary/10":"border-border hover:border-primary/40"}`}>
                  <div className="flex gap-2 items-center mb-0.5">
                    <span className="text-xs font-black text-muted-foreground">Q{i+1}</span>
                    {transcript[i]&&<span className="text-xs text-green-600 font-bold">✓</span>}
                  </div>
                  <p className="font-semibold leading-snug">{q.q}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.hint}</p>
                </button>
              ))}
            </div>
          </section>

          {showGuide&&(
            <section className="rounded-2xl border-2 border-border bg-card p-5">
              <h2 className="font-black text-lg mb-1">🤟 ISL Sign Guide</h2>
              <p className="text-xs text-muted-foreground mb-4">Hold each sign for ~1 second to lock it. Sign up to 3 in a row to form a sentence.</p>
              <div className="space-y-3">
                {Object.entries(SIGNS).map(([key,s])=>(
                  <div key={key} className="flex gap-3 items-start rounded-xl border border-border p-3 bg-muted/40">
                    <span className="text-3xl mt-0.5">{s.emoji}</span>
                    <div>
                      <p className="font-black text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">✋ {s.fingers}</p>
                      <p className="text-xs text-primary font-bold mt-1">→ "{s.phrase}"</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-primary/10 border border-primary/30 p-4">
                <p className="font-black text-sm text-primary mb-2">✨ Sequence Examples</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>🖐️ + 👍 = "Yes, absolutely — I am very confident."</li>
                  <li>🖐️ + ✌️ = "Yes, and I have two years of experience."</li>
                  <li>☝️ + 🤟 = "Let me explain — I'm grateful for this opportunity."</li>
                  <li>✊ + ☝️ = "No, but let me explain my alternative."</li>
                  <li>👌 + 👍 = "I understand completely and I'm very confident."</li>
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
