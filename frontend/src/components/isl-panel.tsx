import { useA11y } from "@/lib/accessibility-context";
import { useEffect, useState } from "react";

const SIGN_MAP: Record<string, string> = {
  hello: "/dataset/Hello.mp4",
  welcome: "/dataset/Welcome_(Reply_to_Thanks).mp4",
  thanks: "/dataset/Thank_You_(Sign_2).mp4",
  thank: "/dataset/Thank_You_(Sign_2).mp4",
  work: "/dataset/Work.mp4",
  help: "/dataset/Help.mp4",
  interview: "/dataset/Interview.mp4",
  salary: "/dataset/Salary.mp4",
  experience: "/dataset/Experience.mp4",
  yes: "/dataset/Yes.mp4",
  happy: "/dataset/Happy.mp4",
  introduce: "/dataset/Introduce.mp4",
  yourself: "/dataset/Yourself.mp4",
};

export function ISLPanel({ text, autoOpen = false }: { text?: string; autoOpen?: boolean }) {
  const { disability } = useA11y();
  const [open, setOpen] = useState(autoOpen || disability === "hearing");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 500);
    return () => clearInterval(id);
  }, [open]);

  const lowerText = text?.toLowerCase() || "";
  const videoSrc = Object.keys(SIGN_MAP).find((k) => lowerText.includes(k))
    ? SIGN_MAP[Object.keys(SIGN_MAP).find((k) => lowerText.includes(k))!]
    : null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Indian Sign Language avatar"
        className="fixed bottom-44 right-4 z-40 h-14 w-14 rounded-full bg-warm text-warm-foreground text-2xl shadow-soft border-2 border-warm-foreground/20"
      >
        🤟
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Indian Sign Language avatar panel"
      className="fixed bottom-44 right-4 z-40 w-64 rounded-2xl bg-card border-2 border-warm shadow-warm p-4 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm">🤟 ISL Avatar</span>
        <button
          onClick={() => setOpen(false)}
          aria-label="Hide ISL avatar"
          className="text-xs px-2 py-1 rounded hover:bg-muted"
        >
          Hide
        </button>
      </div>
      <div className="bg-warm/30 rounded-xl aspect-square flex items-center justify-center relative overflow-hidden">
        {videoSrc ? (
          <video src={videoSrc} autoPlay muted loop className="w-full h-full object-cover" />
        ) : (
          <span className="animate-float text-7xl">{["🙋", "🤟", "👐", "✌️"][frame]}</span>
        )}
      </div>
      <p className="text-xs text-center mt-2 text-muted-foreground">
        {text ? `Signing: "${text}"` : "Demo signing"}
      </p>
    </div>
  );
}
