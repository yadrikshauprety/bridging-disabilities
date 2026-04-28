import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Sign Language Interview — DisabilityBridge" }] }),
  component: InterviewPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────
type EmployerQ = { q: string; expects: string[]; hint: string };

const DEFAULT_QUESTIONS: EmployerQ[] = [
  { q: "Are you comfortable with this role?", expects: ["yes", "no"], hint: "🖐 Open palm = Yes • ✊ Fist = No" },
  { q: "Can you start within two weeks?", expects: ["yes", "no"], hint: "🖐 Yes • ✊ No" },
  { q: "Are you confident you can handle this work?", expects: ["yes", "no", "thumbs_up"], hint: "👍 Thumbs up = Confident" },
  { q: "Do you have at least two years of experience?", expects: ["yes", "no", "peace"], hint: "✌️ Peace = Two years" },
  { q: "Would you like to explain your last project?", expects: ["yes", "no", "point"], hint: "☝️ Point = Let me explain" },
  { q: "Any final words for the panel?", expects: ["ily", "thumbs_up", "yes"], hint: "🤟 ILY = Thank you" },
];

const GESTURE_PHRASE: Record<string, string> = {
  yes: "Yes.",
  no: "No.",
  thumbs_up: "Yes — I am confident I can do this.",
  point: "Let me explain that in detail.",
  peace: "Yes — two years of experience.",
  ily: "Thank you so much for this opportunity.",
};

const GESTURE_LABEL: Record<string, string> = {
  yes: "🖐 Open palm (Yes)",
  no: "✊ Fist (No)",
  thumbs_up: "👍 Thumbs up",
  point: "☝️ Pointing",
  peace: "✌️ Peace / Two",
  ily: "🤟 I-Love-You",
};

// ─── Gesture classifier (pure JS, no model) ──────────────────────────────────
type LM = { x: number; y: number; z: number };

function classifyFrame(lm: LM[]): string | null {
  if (!lm || lm.length < 21) return null;
  const wrist = lm[0];
  const mcp = lm[9];
  const handSize = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y) || 0.0001;
  const tipIds = [4, 8, 12, 16, 20];
  const pipIds = [3, 6, 10, 14, 18];
  const ext = tipIds.map((tip, i) => {
    if (i === 0) {
      const dx = Math.abs(lm[tip].x - lm[5].x) / handSize;
      return dx > 0.5 && lm[tip].y < lm[2].y + handSize * 0.3;
    }
    return (lm[pipIds[i]].y - lm[tip].y) / handSize > 0.15;
  });
  const [thumb, index, middle, ring, pinky] = ext;
  const count = ext.filter(Boolean).length;
  if (count === 0) return "no";
  if (thumb && index && middle && ring && pinky) return "yes";
  if (thumb && !index && !middle && !ring && !pinky) return "thumbs_up";
  if (!thumb && index && !middle && !ring && !pinky) return "point";
  if (!thumb && index && middle && !ring && !pinky) return "peace";
  if (thumb && index && !middle && !ring && pinky) return "ily";
  if (count >= 4) return "yes";
  return null;
}

const BUFFER_SIZE = 25;
function majority(buf: (string | null)[]): { g: string | null; ratio: number } {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const x of buf) {
    if (!x) continue;
    counts[x] = (counts[x] || 0) + 1;
    total++;
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > bestN) { best = k; bestN = v; }
  }
  return { g: best, ratio: total ? bestN / BUFFER_SIZE : 0 };
}

// ─── load MediaPipe script ───────────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
function InterviewPage() {
  const a11y = useA11y();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const bufRef = useRef<(string | null)[]>([]);
  const frameCountRef = useRef(0);
  const lastEmitRef = useRef<{ g: string; ts: number }>({ g: "", ts: 0 });
  const streamRef = useRef<MediaStream | null>(null);

  const [questions, setQuestions] = useState<EmployerQ[]>(DEFAULT_QUESTIONS);
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState<{ q: string; a: string; gesture: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobContext, setJobContext] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  // fetch employer's questions for this job
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    if (jobId) {
      fetch(`http://localhost:5000/api/jobs/${jobId}`)
        .then(r => r.ok ? r.json() : null)
        .then(job => {
          if (job) {
            setJobContext(job);
            if (job.questions?.length > 0) {
              setQuestions(job.questions.map((q: any) => ({
                q: typeof q === "string" ? q : q.q,
                expects: q.expects ?? ["yes", "no"],
                hint: q.hint ?? "🖐 Open palm = Yes • ✊ Fist = No",
              })));
            }
          }
        })
        .catch(() => {/* fallback to DEFAULT_QUESTIONS */});
    }
  }, []);

  // ── MediaPipe ──────────────────────────────────────────────────────────────
  async function ensureMediaPipeLoaded() {
    if ((window as any).Hands) return;
    setLoading(true);
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    setError(null);
    try {
      await ensureMediaPipeLoaded();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      a11y.speak("Camera started. Press Start detecting and answer with a sign.", "assistant");
    } catch (e: any) {
      setError(e?.message || "Camera permission denied.");
      a11y.speak("Could not access the camera.", "assistant");
    }
  }

  function stopCamera() {
    stopDetecting();
    // Stop every track so the browser camera light turns off
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    // Clear canvas so screen goes blank
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStreaming(false);
  }

  useEffect(() => () => stopCamera(), []);

  function onResults(results: any) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mirror: flip so it feels like a selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw the actual video frame so the user can see themselves
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const lms = results?.multiHandLandmarks ?? [];

    let frameGesture: string | null = null;
    for (const hand of lms) {
      // Draw skeleton
      const CONNECTIONS: [number, number][] = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],
        [0,17],
      ];
      ctx.strokeStyle = "rgba(0,230,200,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [a, b] of CONNECTIONS) {
        ctx.moveTo(hand[a].x * canvas.width, hand[a].y * canvas.height);
        ctx.lineTo(hand[b].x * canvas.width, hand[b].y * canvas.height);
      }
      ctx.stroke();

      // Joints
      ctx.fillStyle = "#fff";
      for (const p of hand) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Fingertips
      ctx.fillStyle = "rgba(0,230,200,1)";
      for (const tip of [4, 8, 12, 16, 20]) {
        ctx.beginPath();
        ctx.arc(hand[tip].x * canvas.width, hand[tip].y * canvas.height, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      frameGesture = classifyFrame(hand);
    }
    ctx.restore();

    // Rolling buffer majority vote
    bufRef.current = [...bufRef.current.slice(-(BUFFER_SIZE - 1)), frameGesture];
    const { g, ratio } = majority(bufRef.current);
    setCurrentGesture(g);
    setConfidence(ratio);

    // Emit answer when stable for 60% of buffer
    if (g && ratio >= 0.6) {
      const now = Date.now();
      if (g !== lastEmitRef.current.g || now - lastEmitRef.current.ts > 3000) {
        lastEmitRef.current = { g, ts: now };
        emitAnswer(g);
      }
    }
  }

  function startDetecting() {
    if (!streaming || !(window as any).Hands) return;
    const hands = new (window as any).Hands({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(onResults);
    handsRef.current = hands;
    bufRef.current = [];
    frameCountRef.current = 0;

    const loop = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        frameCountRef.current++;
        if (frameCountRef.current % 2 === 0) {
          try { await hands.send({ image: videoRef.current }); } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    setDetecting(true);
    a11y.speak("Sign detection on. Hold a sign for one second.", "assistant");
  }

  function stopDetecting() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { handsRef.current?.close?.(); } catch {}
    handsRef.current = null;
    setDetecting(false);
    setCurrentGesture(null);
    setConfidence(0);
    bufRef.current = [];
  }

  function emitAnswer(gesture: string) {
    const q = questions[active];
    const phrase = GESTURE_PHRASE[gesture] ?? "Detected.";
    const accepted = !q || q.expects.includes(gesture);
    const finalAnswer = accepted ? phrase : `${phrase} (unexpected for this question)`;

    setTranscript(t => [...t, { q: q?.q ?? "—", a: finalAnswer, gesture }]);
    a11y.pushCaption(`[Sign: ${GESTURE_LABEL[gesture]}] ${finalAnswer}`, "user");
    a11y.speak(finalAnswer, "user");

    if (accepted && active < questions.length - 1) {
      setTimeout(() => askQuestion(active + 1), 1400);
    }
  }

  function askQuestion(i: number) {
    setActive(i);
    bufRef.current = [];
    lastEmitRef.current = { g: "", ts: 0 };
    a11y.speak(questions[i].q, "assistant");
  }

  // Submit transcript to employer via backend
  async function submitInterview() {
    try {
      const payload = {
        jobId: jobContext?.id ?? "unknown",
        candidateId: "pwd_candidate_1",
        employerId: jobContext?.employerId ?? "emp_1",
        transcript,
      };
      await fetch("http://localhost:5000/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
      a11y.speak("Interview submitted successfully to the employer.", "system");
      setTimeout(() => navigate({ to: "/app/jobs" }), 2000);
    } catch {
      a11y.speak("Submission failed. Please try again.", "system");
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🎥 Sign Language Interview</h1>
        <p className="text-muted-foreground text-sm">
          MediaPipe Hands Lite reads your sign, a 25-frame majority vote locks the answer, and it's spoken + captioned.
        </p>
        {jobContext && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-xl">
            <span className="font-bold">Interviewing for:</span>
            <span className="font-black text-primary">{jobContext.title}</span>
            <span className="text-muted-foreground">@ {jobContext.company}</span>
          </div>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-5">
        {/* ── Candidate side ─────────────────────────────────── */}
        <section className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
          <h2 className="font-black text-xl">👤 Candidate View</h2>

          {/* Camera feed */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover opacity-0"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                <span className="text-6xl">📷</span>
                <p className="font-bold">Camera off</p>
                {loading && <p className="text-xs opacity-70 animate-pulse">Loading MediaPipe…</p>}
              </div>
            )}

            {detecting && (
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-black rounded animate-pulse">
                ● DETECTING
              </div>
            )}

            {currentGesture && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 text-sm font-black rounded shadow">
                {GESTURE_LABEL[currentGesture]} · {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          {/* Confidence bar */}
          {detecting && (
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-1">
                Stability {Math.round(confidence * 100)}% · need 60% to lock answer
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${confidence >= 0.6 ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, confidence * 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && <p role="alert" className="text-sm font-bold text-red-500 bg-red-50 rounded-xl p-3">⚠ {error}</p>}

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {!streaming ? (
              <button
                onClick={startCamera}
                className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-2 hover:opacity-90 transition"
              >
                ▶ Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="rounded-xl border-2 border-border font-bold px-5 py-2 hover:bg-muted transition">
                ⏹ Stop Camera
              </button>
            )}
            <button
              onClick={() => detecting ? stopDetecting() : startDetecting()}
              disabled={!streaming || loading}
              aria-pressed={detecting}
              className={`rounded-xl border-2 font-bold px-5 py-2 transition disabled:opacity-50
                ${detecting ? "bg-red-600 text-white border-red-600" : "border-primary hover:bg-primary hover:text-primary-foreground"}`}
            >
              {detecting ? "⏹ Stop Detecting" : "🤟 Start Detecting"}
            </button>
          </div>

          {/* Current question prompt */}
          <div className="rounded-xl bg-primary/10 border-2 border-primary/30 p-4">
            <p className="text-xs font-bold text-primary uppercase mb-1">
              Question {active + 1} of {questions.length}
            </p>
            <p className="font-bold text-lg">{questions[active]?.q}</p>
            <p className="text-xs text-muted-foreground mt-1">{questions[active]?.hint}</p>
          </div>

          {/* Live transcript */}
          <div>
            <h3 className="font-bold text-sm uppercase mb-2 text-muted-foreground">📺 Live Transcript</h3>
            <div aria-live="polite" className="rounded-xl bg-foreground text-background p-4 min-h-[100px] max-h-60 overflow-y-auto space-y-2">
              {transcript.length === 0 ? (
                <p className="italic opacity-60 text-sm">Detected answers appear here…</p>
              ) : transcript.map((t, i) => (
                <div key={i} className="border-b border-background/20 pb-2 last:border-0">
                  <p className="text-xs opacity-60">Q: {t.q}</p>
                  <p>💬 <strong>{t.a}</strong></p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit button */}
          {transcript.length > 0 && !submitted && (
            <button
              onClick={submitInterview}
              className="w-full rounded-xl bg-green-600 text-white font-black py-3 hover:bg-green-700 transition"
            >
              ✓ Submit Interview to Employer
            </button>
          )}
          {submitted && (
            <div className="w-full rounded-xl bg-green-100 text-green-800 font-black py-3 text-center">
              ✅ Submitted! Redirecting…
            </div>
          )}

          {/* Sign vocabulary reference */}
          <details className="text-sm">
            <summary className="cursor-pointer font-bold">🤟 Sign Vocabulary Reference</summary>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1">
              {Object.keys(GESTURE_PHRASE).map(g => (
                <li key={g} className="rounded-lg border border-border p-2">
                  <strong>{GESTURE_LABEL[g]}</strong> → {GESTURE_PHRASE[g]}
                </li>
              ))}
            </ul>
          </details>
        </section>

        {/* ── Questions side ─────────────────────────────────── */}
        <section className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-black text-xl mb-1">📋 Interview Questions</h2>
            <p className="text-xs text-muted-foreground">Questions set by the employer for this job. Click any to jump to it.</p>
          </div>

          <div className="space-y-2">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(i)}
                aria-current={i === active ? "true" : undefined}
                className={`w-full text-left rounded-xl border-2 p-3 transition
                  ${i === active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-muted-foreground">Q{i + 1}</span>
                  {transcript[i] && <span className="text-xs text-green-600 font-bold">✓ Answered</span>}
                </div>
                <div className="font-bold text-sm leading-snug">{q.q}</div>
                <div className="text-xs text-muted-foreground mt-1">{q.hint}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
