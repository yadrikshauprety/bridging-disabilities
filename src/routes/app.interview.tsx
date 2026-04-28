import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Sign Language Interview — DisabilityBridge" }] }),
  component: InterviewPage,
});

const DEFAULT_QUESTIONS = [
  "Tell us about yourself.",
  "Are you comfortable with this role?",
  "How many years of experience do you have?",
  "Can you start within two weeks?",
  "Do you have any questions for us?",
];

// Map detected hand gestures to natural-sounding interview answers.
// Recognised gestures (real, from MediaPipe Hands landmarks):
//   open_palm   → "Yes"
//   fist        → "No"
//   thumbs_up   → "I am confident I can do this."
//   point       → "Let me explain."
//   peace       → "Two — I have two years of experience."
//   ily         → "Thank you for the opportunity."
const GESTURE_PHRASE: Record<string, string> = {
  open_palm: "Yes.",
  fist: "No.",
  thumbs_up: "I am confident I can do this.",
  point: "Let me explain.",
  peace: "Two — two years of experience.",
  ily: "Thank you for this opportunity.",
};

const GESTURE_LABEL: Record<string, string> = {
  open_palm: "🖐 Open palm",
  fist: "✊ Fist",
  thumbs_up: "👍 Thumbs up",
  point: "☝️ Pointing",
  peace: "✌️ Peace",
  ily: "🤟 I-Love-You",
};

declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// Classify 21 MediaPipe hand landmarks → coarse gesture.
// Landmark indices: 0 wrist, 4 thumb tip, 8 index tip, 12 middle tip,
// 16 ring tip, 20 pinky tip; pip joints at tip - 2.
function classifyGesture(lm: { x: number; y: number; z: number }[]): string | null {
  if (!lm || lm.length < 21) return null;
  const tipIds = [4, 8, 12, 16, 20];
  const pipIds = [3, 6, 10, 14, 18];
  // For non-thumb fingers: extended if tip.y < pip.y (image coords: y grows down)
  const ext = tipIds.map((tip, i) => {
    if (i === 0) {
      // Thumb: compare x to MCP because it bends sideways
      return Math.abs(lm[tip].x - lm[pipIds[i]].x) > 0.04 && lm[tip].y < lm[2].y + 0.05;
    }
    return lm[tip].y < lm[pipIds[i]].y - 0.02;
  });
  const [thumb, index, middle, ring, pinky] = ext;
  const count = ext.filter(Boolean).length;

  if (!thumb && !index && !middle && !ring && !pinky) return "fist";
  if (thumb && index && middle && ring && pinky) return "open_palm";
  if (thumb && !index && !middle && !ring && !pinky) return "thumbs_up";
  if (!thumb && index && !middle && !ring && !pinky) return "point";
  if (!thumb && index && middle && !ring && !pinky) return "peace";
  if (thumb && index && !middle && !ring && pinky) return "ily";
  if (count >= 4) return "open_palm";
  return null;
}

function InterviewPage() {
  const a11y = useA11y();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastGestureRef = useRef<{ g: string; ts: number }>({ g: "", ts: 0 });

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ensureMediaPipeLoaded() {
    if (window.Hands && window.Camera) return;
    setLoading(true);
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    setError(null);
    try {
      await ensureMediaPipeLoaded();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      a11y.speak("Camera started. Press Start detecting and sign your answer.", "assistant");
    } catch (e: any) {
      setError(e?.message || "Camera permission denied.");
      a11y.speak("Could not access the camera.", "assistant");
    }
  }

  function stopCamera() {
    stopDetecting();
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  }

  function onResults(results: any) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Mirror so it feels like a selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const lms = results?.multiHandLandmarks?.[0];
    if (lms) {
      // Draw landmarks
      ctx.fillStyle = "rgba(0, 200, 180, 0.95)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
      const CONNECTIONS: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17],
      ];
      ctx.beginPath();
      for (const [a, b] of CONNECTIONS) {
        ctx.moveTo(lms[a].x * canvas.width, lms[a].y * canvas.height);
        ctx.lineTo(lms[b].x * canvas.width, lms[b].y * canvas.height);
      }
      ctx.stroke();
      for (const p of lms) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const g = classifyGesture(lms);
      setCurrentGesture(g);
      if (g) {
        const now = Date.now();
        // Debounce: same gesture must be stable 1.2s before emitting
        if (lastGestureRef.current.g !== g) {
          lastGestureRef.current = { g, ts: now };
        } else if (now - lastGestureRef.current.ts > 1200) {
          const phrase = GESTURE_PHRASE[g];
          setCaptions((c) => (c[c.length - 1] === phrase ? c : [...c, phrase]));
          a11y.pushCaption(`[Sign: ${GESTURE_LABEL[g]}] ${phrase}`, "user");
          lastGestureRef.current = { g: "", ts: now }; // require regrab
        }
      }
    } else {
      setCurrentGesture(null);
    }
    ctx.restore();
  }

  async function startDetecting() {
    if (!streaming) return;
    await ensureMediaPipeLoaded();
    if (!window.Hands) { setError("MediaPipe failed to load."); return; }

    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onResults);
    handsRef.current = hands;

    // Use rAF loop instead of MediaPipe Camera helper for tighter control
    const loop = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try { await hands.send({ image: videoRef.current }); } catch {}
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    setDetecting(true);
    a11y.speak("Sign detection on. Hold a gesture for one second.", "assistant");
  }

  function stopDetecting() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { handsRef.current?.close?.(); } catch {}
    handsRef.current = null;
    setDetecting(false);
    setCurrentGesture(null);
  }

  useEffect(() => () => stopCamera(), []);

  function addQuestion() {
    if (!draft.trim()) return;
    setQuestions((q) => [...q, draft.trim()]);
    setDraft("");
  }

  function askQuestion(i: number) {
    setActive(i);
    setCaptions([]);
    a11y.speak(questions[i], "assistant");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🎥 Sign Language Interview</h1>
        <p className="text-muted-foreground">
          Employers ask. The AI reads your sign language with MediaPipe Hands and captions it live.
        </p>
        <p className="text-xs italic text-muted-foreground mt-1">
          Real hand-landmark detection runs in your browser. Recognised: open palm (Yes), fist (No),
          thumbs up, pointing, peace, and 🤟 I-Love-You.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl mb-3">👤 Candidate view</h2>

          <div className="relative aspect-video bg-foreground rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover opacity-0"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!streaming && (
              <div className="absolute inset-0 grid place-items-center text-background text-center p-6">
                <div>
                  <div className="text-6xl mb-2" aria-hidden>📷</div>
                  <p className="font-bold">Camera off</p>
                  {loading && <p className="text-xs opacity-70 mt-1">Loading MediaPipe…</p>}
                </div>
              </div>
            )}
            {detecting && (
              <div className="absolute top-2 left-2 bg-sos text-sos-foreground px-2 py-1 text-xs font-black rounded animate-pulse">
                ● DETECTING
              </div>
            )}
            {currentGesture && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 text-sm font-black rounded">
                {GESTURE_LABEL[currentGesture]}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-2 text-sm text-sos font-bold">⚠ {error}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {!streaming ? (
              <button onClick={startCamera} aria-label="Start camera" className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-2">
                ▶ Start camera
              </button>
            ) : (
              <button onClick={stopCamera} aria-label="Stop camera" className="rounded-xl border-2 border-border font-bold px-5 py-2">
                ⏹ Stop camera
              </button>
            )}
            <button
              onClick={() => (detecting ? stopDetecting() : startDetecting())}
              disabled={!streaming || loading}
              aria-pressed={detecting}
              aria-label={detecting ? "Stop sign detection" : "Start sign detection"}
              className={`rounded-xl border-2 font-bold px-5 py-2 disabled:opacity-50 ${detecting ? "bg-sos text-sos-foreground border-sos" : "border-primary"}`}
            >
              {detecting ? "⏹ Stop detecting" : "🤟 Start detecting"}
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-bold text-sm uppercase mb-2">📺 Live caption to employer</h3>
            <div aria-live="polite" className="rounded-xl bg-foreground text-background p-4 min-h-32 max-h-48 overflow-y-auto space-y-1">
              {captions.length === 0 ? (
                <p className="italic opacity-70">Detected signs will appear here as captions…</p>
              ) : (
                captions.map((c, i) => <p key={i}>💬 {c}</p>)
              )}
            </div>
          </div>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-bold">🤟 Gesture vocabulary</summary>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1">
              {Object.keys(GESTURE_PHRASE).map((g) => (
                <li key={g} className="rounded-lg border border-border p-2">
                  <strong>{GESTURE_LABEL[g]}</strong> → {GESTURE_PHRASE[g]}
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl mb-3">🏢 Employer panel</h2>
          <div className="space-y-2 mb-4">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(i)}
                aria-current={i === active ? "true" : undefined}
                aria-label={`Ask question ${i + 1}: ${q}`}
                className={`w-full text-left rounded-xl border-2 p-3 transition ${i === active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <div className="text-xs font-bold text-muted-foreground">Q{i + 1}</div>
                <div className="font-bold">{q}</div>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm" htmlFor="newq">Add a question</label>
            <textarea
              id="newq"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="New interview question"
              rows={2}
              className="w-full rounded-xl border-2 border-border bg-background p-2"
            />
            <button onClick={addQuestion} aria-label="Add question" className="w-full rounded-xl bg-accent text-accent-foreground font-bold py-2">
              ＋ Add question
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
