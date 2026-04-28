import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { AccessibilityToolbar } from "@/components/accessibility-toolbar";
import { CaptionBar, LiveCaptionsPanel } from "@/components/captions";
import { GraffitiBackdrop } from "@/components/graffiti-backdrop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DisabilityBridge — Your Accessibility Companion" },
      { name: "description", content: "A safe, guided digital companion for Persons with Disabilities in India. Voice-first, caption-first, ISL-friendly." },
    ],
  }),
  component: Landing,
});

const NARRATION = [
  "Welcome to DisabilityBridge.",
  "A safe, guided companion built for you.",
  "Whether you cannot see, cannot hear, or move differently — this app adapts to you.",
  "Tap Start with Assistance to begin.",
];

function Landing() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!playing) return;
    let i = 0;
    const tick = () => {
      if (i >= NARRATION.length) { setPlaying(false); return; }
      a11y.speak(NARRATION[i], "system");
      setStep(i);
      i++;
      timerRef.current = window.setTimeout(tick, 3500);
    };
    const timerRef = { current: 0 as number };
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); a11y.stopSpeaking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function skipIntro() {
    a11y.stopSpeaking();
    setPlaying(false);
    setStep(NARRATION.length - 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm/40 via-background to-accent/20">
      <header className="px-4 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-xl">
          <span aria-hidden className="text-3xl">🌉</span> DisabilityBridge
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/sign-in"
            aria-label="Sign in"
            className="hidden sm:inline-flex rounded-full border-2 border-primary px-4 py-2 font-bold hover:bg-primary hover:text-primary-foreground transition"
          >
            Sign in
          </Link>
          <AccessibilityToolbar />
        </div>
      </header>

      <main id="main" className="px-4 md:px-10 pb-20">
        <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center pt-8">
          <div className="space-y-6">
            <span className="inline-block bg-warm text-warm-foreground rounded-full px-4 py-1 font-bold text-sm">
              for India's Divyangjan · 2.7Cr+ people
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              A safe, guided <span className="text-primary">companion</span> that adapts to you.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Built so a blind user can use it without seeing, a deaf user without hearing, and a rural user can understand it instantly. Voice. Captions. Sign language. Braille.
            </p>

            <div
              role="region"
              aria-label="Onboarding narration"
              aria-live="polite"
              className="rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-soft"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary mb-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Now playing — audio + captions
              </div>
              <p className="text-xl font-semibold min-h-[3.5rem]">{NARRATION[step]}</p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((step + 1) / NARRATION.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { a11y.stopSpeaking(); navigate({ to: "/onboarding" }); }}
                aria-label="Start with assistance"
                className="rounded-2xl bg-primary text-primary-foreground px-6 py-4 text-lg font-black shadow-soft hover:opacity-95 transition"
              >
                ▶ Start with Assistance
              </button>
              <button
                onClick={skipIntro}
                aria-label="Skip introduction"
                className="rounded-2xl border-2 border-border px-6 py-4 text-lg font-bold hover:bg-muted transition"
              >
                Skip Intro
              </button>
              <Link
                to="/auth/sign-up"
                aria-label="Create an account"
                className="rounded-2xl border-2 border-accent text-accent-foreground bg-accent/30 px-6 py-4 text-lg font-bold hover:bg-accent transition"
              >
                Create account
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Tip: turn on <strong>Hover to Speak</strong> in the Access menu — every button reads itself when you hover.
            </p>
          </div>

          {/* "Video" surface — animated friendly illustration */}
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 via-warm/40 to-accent/30 p-8 shadow-warm border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-[14rem] opacity-20" aria-hidden>🌉</div>
              <div className="relative grid grid-cols-2 gap-4 h-full">
                {[
                  { icon: "👁️", label: "Voice for the blind" },
                  { icon: "👂", label: "Captions for the deaf" },
                  { icon: "♿", label: "Maps for everyone" },
                  { icon: "🤟", label: "Sign + Braille" },
                ].map((c, i) => (
                  <div
                    key={c.label}
                    className="bg-card rounded-2xl p-4 shadow-soft border-2 border-border flex flex-col items-center justify-center text-center animate-float"
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    <div className="text-5xl mb-2" aria-hidden>{c.icon}</div>
                    <div className="font-bold text-sm">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: "2.7Cr+", l: "Persons with Disabilities in India" },
            { n: "36%", l: "Workforce participation rate" },
            { n: "75%", l: "Workplaces with zero accessibility" },
            { n: "250", l: "Certified ISL interpreters in all of India" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-card border-2 border-border p-5 text-center">
              <div className="text-3xl font-black text-primary">{s.n}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </section>
      </main>

      <LiveCaptionsPanel />
      <CaptionBar />
      </div>
    </div>
  );
}
