import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { QUICK_PHRASES } from "@/lib/mock-data";
import { ISLPanel } from "@/components/isl-panel";

export const Route = createFileRoute("/app/communication")({
  head: () => ({ meta: [{ title: "Communication Tools — DisabilityBridge" }] }),
  component: CommunicationPage,
});

function CommunicationPage() {
  const a11y = useA11y();
  const sr = useSpeechRecognition({ continuous: true });
  const [tts, setTts] = useState("Hello, I am a person with disability. Please be patient.");
  const [showSign, setShowSign] = useState(true);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">💬 Communication Tools</h1>
        <p className="text-muted-foreground">Live captions, text-to-speech, sign language, and quick phrases — all in one place.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl">🎤 Speech-to-Text (Live Captions)</h2>
          <p className="text-sm text-muted-foreground">Use this in interviews, classes, or conversations.</p>
          <button
            onClick={() => sr.listening ? sr.stop() : sr.start((r) => a11y.pushCaption(r.transcript, "user"))}
            aria-pressed={sr.listening}
            aria-label={sr.listening ? "Stop captioning" : "Start captioning"}
            className={`mt-3 w-full rounded-xl py-3 font-black ${sr.listening ? "bg-sos text-sos-foreground animate-pulse-ring" : "bg-primary text-primary-foreground"}`}
          >
            {sr.listening ? "⏹ Stop" : "▶ Start"} listening
          </button>
          <div aria-live="polite" className="mt-3 min-h-32 max-h-48 overflow-y-auto rounded-xl bg-muted p-3 text-base">
            {sr.transcript || sr.interim || <span className="italic text-muted-foreground">Speech will appear here…</span>}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="font-black text-xl">🔊 Text-to-Speech</h2>
          <p className="text-sm text-muted-foreground">Type anything and the app will speak for you.</p>
          <textarea
            value={tts}
            onChange={(e) => setTts(e.target.value)}
            aria-label="Text to speak"
            rows={4}
            className="mt-3 w-full rounded-xl border-2 border-border bg-background p-3"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => a11y.speak(tts, "assistant")}
              aria-label="Speak this text"
              className="flex-1 rounded-xl bg-primary text-primary-foreground font-black py-3"
            >
              🔊 Speak
            </button>
            <button
              onClick={a11y.stopSpeaking}
              aria-label="Stop speaking"
              className="rounded-xl border-2 border-border font-bold px-5"
            >
              ⏹
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border-2 border-border bg-card p-5">
        <h2 className="font-black text-xl">⚡ Quick Phrases</h2>
        <p className="text-sm text-muted-foreground">Tap a phrase to say it aloud and show it on screen.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setTts(p);
                a11y.speak(p, "user");
              }}
              aria-label={`Say: ${p}`}
              className="rounded-xl border-2 border-border bg-background p-3 text-left font-bold hover:border-primary"
            >
              💬 {p}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={() => setShowSign((v) => !v)}
        aria-pressed={showSign}
        aria-label="Toggle sign language avatar"
        className="rounded-xl border-2 border-warm bg-warm/30 px-4 py-2 font-bold"
      >
        🤟 {showSign ? "Hide" : "Show"} ISL Avatar
      </button>

      {showSign && <ISLPanel autoOpen text={tts} />}
    </div>
  );
}
