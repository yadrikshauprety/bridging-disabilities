import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useA11y } from "@/lib/accessibility-context";
import { AccessibilityToolbar } from "@/components/accessibility-toolbar";
import { LiveCaptionsPanel, CaptionBar } from "@/components/captions";
import { SOSButton } from "@/components/sos-button";
import { ISLPanel } from "@/components/isl-panel";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { matchVoiceCommand } from "@/lib/voice-router";
import { NotificationBell } from "@/features/interview-bridge/components/NotificationBell";
import { useT } from "@/lib/i18n";

const NAV = [
  { to: "/app", label: "Home", icon: "🏠", exact: true },
  { to: "/app/map", label: "Accessibility Map", icon: "🗺️" },
  { to: "/app/jobs", label: "Jobs", icon: "💼" },
  { to: "/app/schemes", label: "Schemes", icon: "🏛️" },
  { to: "/app/udid", label: "UDID Navigator", icon: "🆔" },
  { to: "/app/wallet", label: "Digital Wallet", icon: "🪪" },
  { to: "/app/communication", label: "Communication", icon: "💬" },
  { to: "/app/scripts", label: "Sign & Braille", icon: "🤟" },
  { to: "/app/interview", label: "Sign Interview", icon: "🎥" },
  { to: "/app/community", label: "Community", icon: "👥" },
  { to: "/app/profile", label: "Profile", icon: "👤" },
];

export function PortalLayout() {
  const a11y = useA11y();
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const sr = useSpeechRecognition({ 
    lang: a11y.language === "Hindi" ? "hi-IN" : "en-IN",
    continuous: a11y.wheelchairMode
  });

  const [lastCommand, setLastCommand] = React.useState<string | null>(null);
  const [lastReply, setLastReply] = React.useState<string | null>(null);
  const commandTimeoutRef = React.useRef<any>(null);

  const handleCommand = React.useCallback((cmd: string) => {
    if (!cmd.trim()) return;
    const intent = matchVoiceCommand(cmd);
    setLastCommand(cmd);
    setLastReply(intent.reply);
    a11y.pushCaption(cmd, "user");
    a11y.speak(intent.reply, "assistant");
    
    if (intent.action === "start-voice") {
      if (!sr.listening) sr.start((res) => handleCommand(res.transcript));
    } else if (intent.action === "stop-voice") {
      sr.stop();
    } else if (intent.to) {
      setTimeout(() => navigate({ to: intent.to as any }), 1200);
    }

    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    commandTimeoutRef.current = setTimeout(() => {
      setLastCommand(null);
      setLastReply(null);
    }, 4000);
  }, [a11y, navigate, sr.listening, sr.start, sr.stop]);

  function toggleMic() {
    if (sr.listening) { sr.stop(); return; }
    a11y.speak("Listening. Say a command.", "assistant");
    sr.start((res) => handleCommand(res.transcript));
  }

  // Wheelchair mode: Auto-restart mic if it stops and mode is on
  React.useEffect(() => {
    if (a11y.wheelchairMode && !sr.listening) {
      const id = setTimeout(() => {
        sr.start((res) => handleCommand(res.transcript));
      }, 500);
      return () => clearTimeout(id);
    }
  }, [a11y.wheelchairMode, sr.listening, sr.start]);

  const isEmployer = typeof window !== "undefined" && localStorage.getItem("db_session") === "employer";

  if (isEmployer) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b-2 border-border px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black" aria-label="Udaan home">
            <span className="text-2xl" aria-hidden>🌉</span> Udaan
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell userId={localStorage.getItem("db_user_id") || "emp_1"} />
            <button
              onClick={() => {
                localStorage.removeItem("db_session");
                navigate({ to: "/auth/sign-in" });
              }}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition"
            >
              Log out
            </button>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <header className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur border-b-2 border-border px-4 py-3 flex items-center justify-between">
        <div className="font-black text-primary">🌉</div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={localStorage.getItem("db_user_id") || "pwd_candidate_1"} />
            <AccessibilityToolbar />
          </div>
      </header>
      {/* Sidebar (desktop) */}
      <aside
        aria-label="Main navigation"
        className="hidden md:flex md:flex-col w-64 bg-sidebar border-r-2 border-sidebar-border p-4 sticky top-0 h-screen"
      >
        <Link to="/app" className="flex items-center gap-2 mb-6 px-2" aria-label="Udaan home">
          <span className="text-3xl" aria-hidden>🌉</span>
          <span className="font-black text-lg leading-tight">Udaan</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                aria-current={active ? "page" : undefined}
                aria-label={t(n.label)}
                onMouseEnter={() => a11y.hoverToSpeak && a11y.speak(t(n.label), "assistant")}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
              >
                <span className="text-xl" aria-hidden>{n.icon}</span>
                <span>{t(n.label)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="text-xs text-muted-foreground px-2 pt-3">
          {t("Profile")}: <span className="font-bold capitalize">{a11y.disability ? t(a11y.disability.charAt(0).toUpperCase() + a11y.disability.slice(1)) : "—"}</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b-2 border-border px-4 py-3 flex items-center gap-2">
          <Link to="/app" className="md:hidden flex items-center gap-2 font-black" aria-label="Udaan home">
            <span className="text-2xl" aria-hidden>🌉</span> Udaan
          </Link>
          <div className="flex-1" />
          <button
            onClick={toggleMic}
            aria-label={sr.listening ? t("Stop listening") : t("Activate voice assistant")}
            aria-pressed={sr.listening}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold border-2 transition ${
              sr.listening ? "bg-sos text-sos-foreground border-sos animate-pulse-ring" : "bg-card border-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            🎤 {sr.listening ? t("Listening…") : t("Voice")}
          </button>
          
          <button
            onClick={() => {
              a11y.toggleWheelchairMode();
              a11y.speak(`Wheelchair mode ${!a11y.wheelchairMode ? "activated" : "deactivated"}`, "assistant");
            }}
            aria-label="Toggle Wheelchair Voice Mode"
            aria-pressed={a11y.wheelchairMode}
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold border-2 transition ${
              a11y.wheelchairMode ? "bg-accent text-accent-foreground border-accent" : "bg-card border-accent hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            ♿ {a11y.wheelchairMode ? t("Voice On") : t("Voice Off")}
          </button>
          <NotificationBell userId={localStorage.getItem("db_user_id") || "pwd_candidate_1"} />
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
                aria-label={t(n.label)}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => a11y.hoverToSpeak && a11y.speak(t(n.label), "assistant")}
                className={`flex flex-col items-center justify-center py-2 ${active ? "text-primary font-bold" : "text-muted-foreground"}`}
              >
                <span className="text-xl" aria-hidden>{n.icon}</span>
                <span className="leading-none mt-0.5">{t(n.label).split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <SOSButton />
      <LiveCaptionsPanel />
      <CaptionBar />
      
      {/* Voice Feedback Overlay */}
      {lastCommand && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-br-none shadow-lg font-bold text-sm">
            “{lastCommand}”
          </div>
          {lastReply && (
            <div className="bg-card border-2 border-primary/20 px-4 py-2 rounded-2xl rounded-tr-none shadow-lg font-medium text-xs text-muted-foreground italic">
              {lastReply}
            </div>
          )}
        </div>
      )}

      {a11y.disability === "hearing" && <ISLPanel />}
    </div>
  );
}
