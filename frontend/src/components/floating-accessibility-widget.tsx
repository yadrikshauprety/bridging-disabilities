import * as React from "react";
import { createPortal } from "react-dom";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useA11y } from "@/lib/accessibility-context";

declare global {
  interface Window {
    documentPictureInPicture: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}

// Keyword to Sign Emoji/Icon Mapping (Simulating Signs)
// Keyword to ISL Video Mapping
const SIGN_MAP: Record<string, string> = {
  hello: "/dataset/hello.mp4",
  welcome: "/dataset/welcome.mp4",
  name: "/dataset/name.mp4",
  job: "/dataset/job.mp4",
  work: "/dataset/work.mp4",
  thank: "/dataset/thank.mp4",
  thanks: "/dataset/thank.mp4",
  yes: "/dataset/yes.mp4",
  no: "/dataset/no.mp4",
  help: "/dataset/help.mp4",
  interview: "/dataset/interview.mp4",
  salary: "/dataset/salary.mp4",
  experience: "/dataset/experience.mp4",
  skills: "/dataset/skills.mp4",
};

export function FloatingAccessibilityWidget() {
  const a11y = useA11y();
  const [open, setOpen] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [currentSign, setCurrentSign] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({
    x: window.innerWidth - 340,
    y: window.innerHeight - 500,
  });
  const [pipContainer, setPipContainer] = React.useState<HTMLElement | null>(null);
  const dragOffset = React.useRef({ x: 0, y: 0 });

  const [capturingSystem, setCapturingSystem] = React.useState(false);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const intervalRef = React.useRef<any>(null);

  const handleCaptureAudio = async () => {
    if (typeof window.MediaRecorder === "undefined") {
      alert("Audio recording is not supported in this browser. Please use Chrome.");
      return;
    }
    try {
      a11y.speak(
        "To hear the other side, please select your Google Meet tab and check 'Share Audio'.",
        "assistant",
      );
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        a11y.speak(
          "No audio shared. Please try again and ensure 'Share Audio' is checked.",
          "assistant",
        );
        return;
      }

      setCapturingSystem(true);
      const audioStream = new MediaStream([audioTrack]);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";

      const recorder = new MediaRecorder(audioStream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const formData = new FormData();
          formData.append("audio", e.data);
          try {
            const res = await fetch("http://localhost:5000/api/ml/transcribe", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (data.text) {
              handleResult({ transcript: data.text });
            }
          } catch (err) {
            console.error("Transcription error", err);
          }
        }
      };

      // Record in 4-second chunks
      recorder.start();
      intervalRef.current = setInterval(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          recorder.start();
        }
      }, 4000);

      a11y.speak("System audio connected. Transcribing interviewer now.", "assistant");

      audioTrack.onended = () => {
        setCapturingSystem(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        recorder.stop();
      };
    } catch (err) {
      console.error("Failed to capture audio", err);
    }
  };

  const handleResult = (res: any) => {
    const text = res.transcript.toLowerCase();
    setTranscript(res.transcript);

    // AI-Style Glossing Mapping (Enhanced)
    const GLOSS_MAP: Record<string, string> = {
      ...SIGN_MAP,
      hello: "👋",
      hi: "👋",
      welcome: "🤝",
      job: "💼",
      work: "🛠️",
      career: "🚀",
      salary: "💰",
      money: "💳",
      pay: "💵",
      experience: "📈",
      history: "📜",
      years: "🗓️",
      skills: "🧠",
      tools: "🛠️",
      languages: "🗣️",
      yes: "✅",
      correct: "👍",
      sure: "👌",
      no: "❌",
      wrong: "👎",
      cannot: "🚫",
      help: "🆘",
      support: "🛡️",
      assist: "🤝",
      interview: "🎥",
      meeting: "👥",
      call: "📞",
      thank: "🤟",
      thanks: "🤟",
      appreciate: "🙏",
    };

    const words = text.split(" ");
    // Find the latest significant word
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i].replace(/[.,?!]/g, "");
      if (GLOSS_MAP[word]) {
        setCurrentSign(GLOSS_MAP[word]);
        // Don't clear immediately, let the user see it
        setTimeout(() => setCurrentSign(null), 4000);
        break;
      }
    }
  };

  const sr = useSpeechRecognition({
    lang: a11y.language === "Hindi" ? "hi-IN" : "en-IN",
    continuous: true,
  });

  const toggleWidget = () => {
    if (pipContainer) {
      window.documentPictureInPicture.window?.close();
      setPipContainer(null);
      setOpen(false);
      return;
    }
    if (!open) {
      setOpen(true);
      sr.start(handleResult);
      a11y.speak("Accessibility assistant active. Listening to your interview.", "assistant");
    } else {
      setOpen(false);
      sr.stop();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (pipContainer) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handlePopOut = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert(
        "Picture-in-Picture is not supported in your browser. Please use Chrome/Edge for the floating assistant.",
      );
      return;
    }

    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 480,
      });

      // Copy styles to the new window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
          const style = document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement("link");
          if (styleSheet.href) {
            link.rel = "stylesheet";
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      // Move the widget content to the PIP window
      const container = pipWindow.document.createElement("div");
      container.id = "pip-root";
      pipWindow.document.body.appendChild(container);

      setPipContainer(container);
      a11y.speak("Assistant popped out. You can now switch to your interview tab.", "assistant");

      pipWindow.addEventListener("pagehide", () => {
        setPipContainer(null);
      });
    } catch (err) {
      console.error("PiP failed", err);
    }
  };

  const widgetContent = (
    <div
      style={pipContainer ? {} : { left: position.x, top: position.y }}
      className={`${pipContainer ? "w-full h-full" : "fixed w-80"} bg-card border-2 border-primary rounded-3xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-90`}
    >
      <header
        onMouseDown={handleMouseDown}
        className="bg-primary p-3 flex items-center justify-between text-white cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🌉</span>
          <span className="font-black text-xs uppercase tracking-widest">A11y Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {!pipContainer && (
            <button
              onClick={handlePopOut}
              className="hover:bg-white/20 p-1 rounded transition text-[10px] font-bold border border-white/40 px-2"
              title="Pop out into always-on-top window"
            >
              POP OUT ↗
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <button onClick={toggleWidget} className="hover:opacity-70 p-1">
            ✕
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Sign Interpretation Panel - Enhanced to look like an AI feed */}
        <div className="h-32 bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-border">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          </div>

          {currentSign ? (
            <div className="flex flex-col items-center w-full h-full animate-in zoom-in-50 duration-300">
              {currentSign.endsWith(".mp4") ? (
                <video
                  src={currentSign}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if video missing
                    (e.target as any).style.display = "none";
                    const word =
                      Object.keys(SIGN_MAP).find((k) => SIGN_MAP[k] === currentSign) || "hello";
                    const fallbackEmojis: any = { hello: "👋", work: "💼", thank: "🤟" };
                    setCurrentSign(fallbackEmojis[word] || "🤟");
                  }}
                />
              ) : (
                <>
                  <div className="text-6xl mb-1">{currentSign}</div>
                  <span className="text-[8px] font-black uppercase text-primary-foreground/50 tracking-widest">
                    Translating to ISL...
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center opacity-40">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center mb-2">
                <span className="text-xl">👤</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                Waiting for Sign Context
              </p>
            </div>
          )}

          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
            <span className="text-[8px] font-black text-primary uppercase opacity-50">
              ISL AI BRIDGE v1.2
            </span>
          </div>
        </div>

        {/* Live Captions - High Contrast */}
        <div className="bg-background rounded-2xl p-4 border-2 border-primary/10 h-36 overflow-y-auto scrollbar-hide shadow-inner">
          <div className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary" /> Real-time Transcript
          </div>
          <p className="text-sm font-extrabold leading-relaxed text-foreground antialiased">
            {transcript || (
              <span className="opacity-30 italic">
                Start speaking or wait for interview audio...
              </span>
            )}
          </p>
        </div>

        <footer className="flex flex-col gap-3 text-[10px] font-black uppercase text-muted-foreground px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-muted px-2 py-0.5 rounded">{a11y.language}</span>
              <span className="bg-muted px-2 py-0.5 rounded">AI Glossing</span>
            </div>
            <span
              className={
                sr.listening
                  ? "text-green-600 flex items-center gap-1"
                  : "text-sos flex items-center gap-1"
              }
            >
              {sr.listening ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Listening
                </>
              ) : (
                "○ Mic Off"
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCaptureAudio}
              className={`flex-1 py-2 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                capturingSystem
                  ? "bg-green-100 border-green-500 text-green-700"
                  : "bg-muted border-border hover:border-primary"
              }`}
            >
              {capturingSystem ? "✅ Hearing Other Person" : "🎥 Capture Other Side"}
            </button>
            {capturingSystem && <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />}
          </div>

          {!capturingSystem && (
            <p className="text-[8px] opacity-60 leading-tight">
              Tip: Click above & share your Google Meet tab with "Share Audio" to hear the
              interviewer.
            </p>
          )}
        </footer>
      </div>
    </div>
  );

  if (!open && !pipContainer) {
    return (
      <button
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transition z-50 border-4 border-white animate-bounce-subtle"
        title="Open Accessibility Assistant"
      >
        🌉
      </button>
    );
  }

  if (pipContainer) {
    return createPortal(widgetContent, pipContainer);
  }

  return widgetContent;
}
