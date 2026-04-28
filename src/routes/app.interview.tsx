import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Sign Language Interview — DisabilityBridge" }] }),
  component: InterviewPage,
});

// Employer-side question bank. Every question is answerable with a single sign
// (Yes / No / Thumbs up / Peace=2 / ILY=Thank you / Point=Explain) so the
// candidate never has to fingerspell. This is what real accessible interviews
// look like — closed questions, sign-friendly answers.
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

declare global {
  interface Window {
    Hands?: any;
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

type LM = { x: number; y: number; z: number };

// Frame-level classification from 21 hand landmarks → coarse gesture token.
// Uses normalized landmark distances + finger-extension flags. Pure JS, no model.
function classifyFrame(lm: LM[]): string | null {
  if (!lm || lm.length < 21) return null;

  // Normalize by hand size (wrist→middle MCP) so it works near & far from camera
  const wrist = lm[0];
  const mcp = lm[9];
  const handSize = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y) || 0.0001;

  const tipIds = [4, 8, 12, 16, 20];
  const pipIds = [3, 6, 10, 14, 18];

  const ext = tipIds.map((tip, i) => {
    if (i === 0) {
      // Thumb: lateral distance from index MCP, normalized
      const dx = Math.abs(lm[tip].x - lm[5].x) / handSize;
      return dx > 0.5 && lm[tip].y < lm[2].y + handSize * 0.3;
    }
    // Other fingers: tip clearly above pip (smaller y)
    return (lm[pipIds[i]].y - lm[tip].y) / handSize > 0.15;
  });

  const [thumb, index, middle, ring, pinky] = ext;
  const count = ext.filter(Boolean).length;

  if (count === 0) return "no"; // fist
  if (thumb && index && middle && ring && pinky) return "yes"; // open palm
  if (thumb && !index && !middle && !ring && !pinky) return "thumbs_up";
  if (!thumb && index && !middle && !ring && !pinky) return "point";
  if (!thumb && index && middle && !ring && !pinky) return "peace";
  if (thumb && index && !middle && !ring && pinky) return "ily";
  if (count >= 4) return "yes";
  return null;
}

// Rolling temporal buffer with majority vote — this is the "tiny TCN" idea
// without shipping a model: we look at the last N frames, take the most
// frequent gesture, and only fire if it dominates ≥ 60% of the window.
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

function InterviewPage() {
  const a11y = useA11y();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const bufRef = useRef<(string | null)[]>([]);
  const frameCountRef = useRef(0);
  const lastEmitRef = useRef<{ g: string; ts: number }>({ g: "", ts: 0 });

  const [questions, setQuestions] = useState<EmployerQ[]>(DEFAULT_QUESTIONS);
  const [draftQ, setDraftQ] = useState("");
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [transcript, setTranscript] = useState<{ q: string; a: string; gesture: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function ensureMediaPipeLoaded() {
    if (window.Hands) return;
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
        video: { width: 480, height: 360 }, // smaller frame = faster CPU inference
        audio: false,
      });
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
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  }

  function emitAnswer(gesture: string) {
    const q = questions[active];
    // Map gesture → natural answer. If gesture isn't in expected set for this
    // question, still accept it but mark it.
    const phrase = GESTURE_PHRASE[gesture] ?? "Detected.";
    const accepted = !q || q.expects.includes(gesture);
    const finalAnswer = accepted ? phrase : `${phrase} (unexpected for this question)`;
    setTranscript((t) => [...t, { q: q?.q ?? "—", a: finalAnswer, gesture }]);
    a11y.pushCaption(`[Sign: ${GESTURE_LABEL[gesture]}] ${finalAnswer}`, "user");
    a11y.speak(finalAnswer, "user");
    // Auto-advance to next question if accepted
    if (accepted && active < questions.length - 1) {
      setTimeout(() => askQuestion(active + 1), 1400);
    }
  }

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
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // selfie mirror
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const lms: LM[] | undefined = results?.multiHandLandmarks?.[0];
    let frameGesture: string | null = null;

    if (lms) {
      ctx.fillStyle = "rgba(0, 200, 180, 0.95)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
      const CONNECTIONS: [number, number][] = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],
        [0,17],
      ];
      ctx.beginPath();
      for (const [a, b] of CONNECTIONS) {
        ctx.moveTo(lms[a].x * canvas.width, lms[a].y * canvas.height);
        ctx.lineTo(lms[b].x * canvas.width, lms[b].y * canvas.height);
      }
      ctx.stroke();
      for (const p of lms) {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      frameGesture = classifyFrame(lms);
    }
    ctx.restore();

    // Push into rolling buffer
    const buf = bufRef.current;
    buf.push(frameGesture);
    if (buf.length > BUFFER_SIZE) buf.shift();

    const { g, ratio } = majority(buf);
    setCurrentGesture(g);
    setConfidence(ratio);

    // Emit only when stable: ≥60% of last 25 frames AND different from last emit
    if (g && ratio >= 0.6) {
      const now = Date.now();
      if (lastEmitRef.current.g !== g || now - lastEmitRef.current.ts > 2500) {
        lastEmitRef.current = { g, ts: now };
        bufRef.current = []; // reset window after emit
        emitAnswer(g);
      }
    }
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
      modelComplexity: 0, // LITE model — Hands Lite, fastest
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(onResults);
    handsRef.current = hands;
    bufRef.current = [];
    frameCountRef.current = 0;

    // Frame-skipping rAF loop: process every 2nd frame (~target 15-30fps inference)
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

  useEffect(() => () => stopCamera(), []);

  function addQuestion() {
    if (!draftQ.trim()) return;
    setQuestions((q) => [...q, { q: draftQ.trim(), expects: ["yes", "no"], hint: "🖐 Yes • ✊ No" }]);
    setDraftQ("");
  }

  function askQuestion(i: number) {
    setActive(i);
    bufRef.current = [];
    lastEmitRef.current = { g: "", ts: 0 };
    a11y.speak(questions[i].q, "assistant");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🎥 Sign Language Interview</h1>
        <p className="text-muted-foreground">
          Employers ask Yes/No questions. MediaPipe Hands Lite reads your signs, a rolling 25-frame
          majority vote smooths the prediction, and the answer is captioned + spoken to the panel.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl mb-3">👤 Candidate view</h2>

          <div className="relative aspect-video bg-foreground rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover opacity-0" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
            {!streaming && (
              <div className="absolute inset-0 grid place-items-center text-background text-center p-6">
                <div>
                  <div className="text-6xl mb-2" aria-hidden>📷</div>
                  <p className="font-bold">Camera off</p>
                  {loading && <p className="text-xs opacity-70 mt-1">Loading MediaPipe Hands Lite…</p>}
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
                {GESTURE_LABEL[currentGesture]} · {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          {/* Confidence bar — visualises the rolling buffer */}
          {detecting && (
            <div className="mt-2">
              <div className="text-xs font-bold text-muted-foreground mb-1">
                Stability {Math.round(confidence * 100)}% · need 60% to lock
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${confidence >= 0.6 ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, confidence * 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && <p role="alert" className="mt-2 text-sm text-sos font-bold">⚠ {error}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            {!streaming ? (
              <button onClick={startCamera} className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-2">
                ▶ Start camera
              </button>
            ) : (
              <button onClick={stopCamera} className="rounded-xl border-2 border-border font-bold px-5 py-2">
                ⏹ Stop camera
              </button>
            )}
            <button
              onClick={() => (detecting ? stopDetecting() : startDetecting())}
              disabled={!streaming || loading}
              aria-pressed={detecting}
              className={`rounded-xl border-2 font-bold px-5 py-2 disabled:opacity-50 ${detecting ? "bg-sos text-sos-foreground border-sos" : "border-primary"}`}
            >
              {detecting ? "⏹ Stop detecting" : "🤟 Start detecting"}
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-bold text-sm uppercase mb-2">📺 Live transcript to employer</h3>
            <div aria-live="polite" className="rounded-xl bg-foreground text-background p-4 min-h-32 max-h-64 overflow-y-auto space-y-2">
              {transcript.length === 0 ? (
                <p className="italic opacity-70">Detected answers will appear here…</p>
              ) : (
                transcript.map((t, i) => (
                  <div key={i} className="border-b border-background/20 pb-2 last:border-0">
                    <p className="text-xs opacity-70">Q: {t.q}</p>
                    <p>💬 <strong>{t.a}</strong></p>
                  </div>
                ))
              )}
            </div>
          </div>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-bold">🤟 Sign vocabulary</summary>
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
          <p className="text-xs text-muted-foreground mb-3">
            All questions are sign-friendly (Yes/No or single-sign answers).
          </p>
          <div className="space-y-2 mb-4">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => askQuestion(i)}
                aria-current={i === active ? "true" : undefined}
                className={`w-full text-left rounded-xl border-2 p-3 transition ${i === active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <div className="text-xs font-bold text-muted-foreground">Q{i + 1}</div>
                <div className="font-bold">{q.q}</div>
                <div className="text-xs text-muted-foreground mt-1">{q.hint}</div>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm" htmlFor="newq">Add a Yes/No question</label>
            <textarea
              id="newq"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              rows={2}
              className="w-full rounded-xl border-2 border-border bg-background p-2"
              placeholder="e.g. Are you available on weekends?"
            />
            <button onClick={addQuestion} className="w-full rounded-xl bg-accent text-accent-foreground font-bold py-2">
              ＋ Add question
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
