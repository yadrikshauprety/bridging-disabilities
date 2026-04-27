import { useA11y } from "@/lib/accessibility-context";
import { useEffect, useState } from "react";

/**
 * Mock ISL (Indian Sign Language) avatar panel.
 * Cycles through a friendly waving animation and shows the current "sign" label.
 */
export function ISLPanel({ text, autoOpen = false }: { text?: string; autoOpen?: boolean }) {
  const { disability } = useA11y();
  const [open, setOpen] = useState(autoOpen || disability === "hearing");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 4), 500);
    return () => clearInterval(id);
  }, [open]);

  const poses = ["🙋", "🤟", "👐", "✌️"];

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
      className="fixed bottom-44 right-4 z-40 w-64 rounded-2xl bg-card border-2 border-warm shadow-warm p-4"
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
      <div className="bg-warm/30 rounded-xl aspect-square flex items-center justify-center text-7xl">
        <span className="animate-float">{poses[frame]}</span>
      </div>
      <p className="text-xs text-center mt-2 text-muted-foreground">
        {text ? `Signing: "${text}"` : "Demo signing"}
      </p>
    </div>
  );
}
