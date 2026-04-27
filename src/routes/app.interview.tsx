import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Sign Language Interview — DisabilityBridge" }] }),
  component: InterviewPage,
});

const DEFAULT_QUESTIONS = [
  "Tell us about yourself.",
  "Why do you want this role?",
  "What is your biggest strength?",
];

// Mock detection cycle — what the AI would caption from candidate signs.
const MOCK_ANSWERS = [
  ["Hello.", "My name is candidate.", "I am from Pune.", "I have 2 years experience."],
  ["I want to grow my career.", "Your company supports accessibility.", "I am excited."],
  ["I am a fast learner.", "I work well in a team.", "I never give up."],
];

function InterviewPage() {
  const a11y = useA11y();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setStreaming(true);
      a11y.speak("Camera started. Sign your answer.", "assistant");
    } catch {
      a11y.speak("Could not access camera. Please allow permission.", "assistant");
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
    setDetecting(false);
  }
  useEffect(() => () => stopCamera(), []);

  // Simulated sign detection — emits captions every ~1.6s
  useEffect(() => {
    if (!detecting) return;
    const pool = MOCK_ANSWERS[active % MOCK_ANSWERS.length];
    let i = 0;
    const id = setInterval(() => {
      const phrase = pool[i % pool.length];
      setCaptions((c) => [...c, phrase]);
      a11y.pushCaption(`[Detected sign] ${phrase}`, "user");
      i++;
    }, 1600);
    return () => clearInterval(id);
  }, [detecting, active, a11y]);

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
          Employers post questions. Deaf candidates answer in sign language. The AI captions it live for the employer.
        </p>
        <p className="text-xs italic text-muted-foreground mt-1">
          Demo mode: detection is simulated — real builds use OpenCV / MediaPipe in the browser.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        {/* Camera + captions */}
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl mb-3">👤 Candidate view</h2>
          <div className="relative aspect-video bg-foreground rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {!streaming && (
              <div className="absolute inset-0 grid place-items-center text-background text-center p-6">
                <div>
                  <div className="text-6xl mb-2" aria-hidden>📷</div>
                  <p className="font-bold">Camera off</p>
                </div>
              </div>
            )}
            {detecting && (
              <div className="absolute top-2 left-2 bg-sos text-sos-foreground px-2 py-1 text-xs font-black rounded animate-pulse">
                ● DETECTING SIGN
              </div>
            )}
          </div>

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
              onClick={() => setDetecting((v) => !v)}
              disabled={!streaming}
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
        </section>

        {/* Employer panel */}
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
            <label className="font-bold text-sm">Add a question</label>
            <textarea
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
