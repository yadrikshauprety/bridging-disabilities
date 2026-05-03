import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { matchVoiceCommand, VOICE_EXAMPLES } from "@/lib/voice-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Home — Udaan" }] }),
  component: Home,
});

interface Turn { id: string; user: string; reply: string; ts: number }
interface Session { id: string; employer_id: string; job_title: string; status: string; created_at: string }

function Home() {
  const a11y = useA11y();
  const t = useT();
  const navigate = useNavigate();
  const sr = useSpeechRecognition();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [lastReply, setLastReply] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);


  function runCommand(cmd: string) {
    const intent = matchVoiceCommand(cmd);
    a11y.pushCaption(cmd, "user");
    a11y.speak(intent.reply, "assistant");
    setLastReply(intent.reply);
    setTurns((t) => [...t, { id: `${Date.now()}`, user: cmd, reply: intent.reply, ts: Date.now() }]);
    if (intent.to) setTimeout(() => navigate({ to: intent.to as any }), 700);
  }

  function toggleMic() {
    if (sr.listening) { sr.stop(); return; }
    a11y.speak("Listening. Say a command.", "assistant");
    sr.start((res) => runCommand(res.transcript));
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Interview Invites Notification */}

      <section
        aria-label="Live voice command demo"
        className="rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent p-6 md:p-8 text-primary-foreground shadow-warm"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{t("Hi there 👋 Try the voice assistant")}</h1>
            <p className="opacity-90 mt-1">{t("Tap the mic and speak — the app navigates for you.")}</p>
          </div>
          <button
            onClick={toggleMic}
            aria-label={sr.listening ? t("Stop listening") : t("Start voice command")}
            aria-pressed={sr.listening}
            className={`relative h-24 w-24 rounded-full text-3xl font-black border-4 ${
              sr.listening ? "bg-sos border-card animate-pulse-ring" : "bg-card text-primary border-card"
            }`}
          >
            🎤
            {sr.listening && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sos text-sos-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded-full">REC</span>
            )}
          </button>
        </div>

        <div className="mt-5 bg-card text-foreground rounded-2xl p-4 border-2 border-card/50">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">{t("Live transcript")}</div>
          <p className="min-h-[2.5rem] text-lg font-semibold">
            {sr.interim || sr.transcript || (sr.listening ? t("Listening…") : t("Tap the mic to begin."))}
          </p>
          {lastReply && (
            <div className="mt-2 inline-block rounded-full bg-primary text-primary-foreground px-3 py-1 text-sm font-bold">
              💬 {lastReply}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {VOICE_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => runCommand(ex)}
              aria-label={`Try command: ${ex}`}
              className="rounded-full bg-card/20 hover:bg-card/40 border border-card/40 px-3 py-1 text-sm font-semibold"
            >
              "{ex}"
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
          aria-label={t("Toggle conversation history")}
          className="mt-4 text-sm font-bold underline"
        >
          {showHistory ? t("Hide") : t("Show")} {t("conversation history")} ({turns.length})
        </button>
        {showHistory && (
          <ul className="mt-3 space-y-2 text-sm bg-card text-foreground rounded-2xl p-3 max-h-48 overflow-y-auto">
            {turns.length === 0 && <li className="text-muted-foreground italic">Nothing yet.</li>}
            {turns.map((t) => (
              <li key={t.id} className="border-b last:border-b-0 border-border pb-2">
                <div><span className="font-bold">You:</span> {t.user}</div>
                <div><span className="font-bold text-primary">App:</span> {t.reply}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Quick access" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: "/app/map", icon: "🗺️", title: "Accessibility Map", desc: "Find ramps, lifts, accessible toilets, braille nearby." },
          { to: "/app/jobs", icon: "💼", title: "Jobs", desc: "Verified accessible employers only." },
          { to: "/app/schemes", icon: "🏛️", title: "Schemes", desc: "What benefits am I owed?" },
          { to: "/app/udid", icon: "🆔", title: "UDID Navigator", desc: "Step-by-step disability ID guide." },
          { to: "/app/communication", icon: "💬", title: "Communication", desc: "Live captions, TTS, ISL avatar." },
          { to: "/app/scripts", icon: "🤟", title: "Sign & Braille", desc: "Fingerspell + Braille translator." },
          { to: "/app/interview", icon: "🎥", title: "Sign Interview", desc: "Camera-based ISL interview practice." },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to as any}
            aria-label={`${t(c.title)}: ${t(c.desc)}`}
            className="rounded-2xl border-2 border-border bg-card p-5 hover:border-primary hover:shadow-soft transition group"
          >
            <div className="text-4xl mb-2" aria-hidden>{c.icon}</div>
            <div className="font-bold text-lg group-hover:text-primary">{t(c.title)}</div>
            <div className="text-sm text-muted-foreground mt-1">{t(c.desc)}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
