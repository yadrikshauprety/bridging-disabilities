import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useA11y } from "@/lib/accessibility-context";
import { AccessibilityToolbar } from "@/components/accessibility-toolbar";
import { LiveCaptionsPanel, CaptionBar } from "@/components/captions";
import { SOSButton } from "@/components/sos-button";
import { ISLPanel } from "@/components/isl-panel";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { matchVoiceCommand } from "@/lib/voice-router";

const NAV = [
  { to: "/app", label: "Home", icon: "🏠", exact: true },
  { to: "/app/map", label: "Accessibility Map", icon: "🗺️" },
  { to: "/app/jobs", label: "Jobs", icon: "💼" },
  { to: "/app/schemes", label: "Schemes", icon: "🏛️" },
  { to: "/app/udid", label: "UDID Navigator", icon: "🆔" },
  { to: "/app/communication", label: "Communication", icon: "💬" },
  { to: "/app/scripts", label: "Sign & Braille", icon: "🤟" },
  { to: "/app/interview", label: "Sign Interview", icon: "🎥" },
  { to: "/app/community", label: "Community", icon: "👥" },
  { to: "/app/profile", label: "Profile", icon: "👤" },
];

export function PortalLayout() {
  const a11y = useA11y();
  const location = useLocation();
  const navigate = useNavigate();
  const sr = useSpeechRecognition({ lang: a11y.language === "Hindi" ? "hi-IN" : "en-IN" });

  function toggleMic() {
    if (sr.listening) { sr.stop(); return; }
    a11y.speak("Listening. Say a command.", "assistant");
    sr.start((res) => {
      const intent = matchVoiceCommand(res.transcript);
      a11y.pushCaption(res.transcript, "user");
      a11y.speak(intent.reply, "assistant");
      if (intent.to) setTimeout(() => navigate({ to: intent.to as any }), 600);
    });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar (desktop) */}
      <aside
        aria-label="Main navigation"
        className="hidden md:flex md:flex-col w-64 bg-sidebar border-r-2 border-sidebar-border p-4 sticky top-0 h-screen"
      >
        <Link to="/app" className="flex items-center gap-2 mb-6 px-2" aria-label="DisabilityBridge home">
          <span className="text-3xl" aria-hidden>🌉</span>
          <span className="font-black text-lg leading-tight">Disability<br/>Bridge</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                aria-current={active ? "page" : undefined}
                aria-label={n.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                <span className="text-xl" aria-hidden>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="text-xs text-muted-foreground px-2 pt-3">
          Profile: <span className="font-bold capitalize">{a11y.disability ?? "—"}</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b-2 border-border px-4 py-3 flex items-center gap-2">
          <Link to="/app" className="md:hidden flex items-center gap-2 font-black" aria-label="DisabilityBridge home">
            <span className="text-2xl" aria-hidden>🌉</span> DB
          </Link>
          <div className="flex-1" />
          <button
            onClick={toggleMic}
            aria-label={sr.listening ? "Stop listening" : "Activate voice assistant"}
            aria-pressed={sr.listening}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold border-2 transition ${
              sr.listening ? "bg-sos text-sos-foreground border-sos animate-pulse-ring" : "bg-card border-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            🎤 {sr.listening ? "Listening…" : "Voice"}
          </button>
          <AccessibilityToolbar />
        </header>

        <main id="main" className="flex-1 px-4 md:px-8 py-6 pb-32 md:pb-12">
          <Outlet />
        </main>

        {/* Bottom nav (mobile) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t-2 border-border grid grid-cols-5 text-xs"
        >
          {NAV.slice(0, 5).map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                aria-label={n.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-2 ${active ? "text-primary font-bold" : "text-muted-foreground"}`}
              >
                <span className="text-xl" aria-hidden>{n.icon}</span>
                <span className="leading-none mt-0.5">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <SOSButton />
      <LiveCaptionsPanel />
      <CaptionBar />
      {a11y.disability === "hearing" && <ISLPanel />}
    </div>
  );
}
