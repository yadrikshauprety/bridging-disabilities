import { useA11y } from "@/lib/accessibility-context";
import { useEffect, useRef } from "react";

/**
 * Floating "Live Captions" panel — auto-shown for hearing-impaired users.
 * Mirrors everything the app says: system, assistant, hover, user.
 */
export function LiveCaptionsPanel() {
  const { captions, captionsVisible, setCaptionsVisible, clearCaptions, disability } = useA11y();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions]);

  // Auto-show for deaf users on mount
  useEffect(() => {
    if (disability === "hearing" && !captionsVisible) {
      setCaptionsVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disability]);

  if (!captionsVisible) {
    return (
      <button
        onClick={() => setCaptionsVisible(true)}
        aria-label="Show live captions panel"
        className="fixed top-20 right-4 z-40 hidden md:flex items-center gap-2 rounded-full bg-card border-2 border-primary px-4 py-2 text-sm font-semibold shadow-soft hover:bg-primary hover:text-primary-foreground transition"
      >
        💬 Show Captions
      </button>
    );
  }

  const colorFor = (s: string) => {
    switch (s) {
      case "user": return "text-accent-foreground bg-accent/30 border-accent";
      case "assistant": return "text-primary-foreground bg-primary border-primary";
      case "hover": return "text-warm-foreground bg-warm/60 border-warm";
      default: return "text-foreground bg-muted border-border";
    }
  };

  return (
    <aside
      role="region"
      aria-label="Live captions panel"
      aria-live="polite"
      className="fixed top-20 right-4 z-40 hidden md:flex flex-col w-80 max-h-[60vh] rounded-2xl border-2 border-primary bg-card shadow-soft"
    >
      <header className="flex items-center justify-between px-3 py-2 border-b-2 border-border">
        <span className="font-bold flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live Captions
        </span>
        <div className="flex gap-1">
          <button
            onClick={clearCaptions}
            aria-label="Clear all captions"
            className="text-xs px-2 py-1 rounded hover:bg-muted"
          >
            Clear
          </button>
          <button
            onClick={() => setCaptionsVisible(false)}
            aria-label="Hide captions panel"
            className="text-xs px-2 py-1 rounded hover:bg-muted"
          >
            Hide
          </button>
        </div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {captions.length === 0 ? (
          <p className="text-muted-foreground italic">Captions will appear here as the app speaks or you give voice commands.</p>
        ) : (
          captions.slice(-30).map((c) => (
            <div key={c.id} className={`rounded-lg border px-2 py-1 ${colorFor(c.source)}`}>
              <span className="text-[10px] uppercase font-bold opacity-70">{c.source}</span>
              <p className="leading-snug">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

/** Bottom caption bar — always shows the latest line. Mobile-friendly. */
export function CaptionBar() {
  const { captions, captionsEnabled } = useA11y();
  if (!captionsEnabled) return null;
  const latest = captions[captions.length - 1];
  if (!latest) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] md:max-w-2xl bg-foreground text-background rounded-xl px-4 py-2 text-sm md:text-base font-medium shadow-warm pointer-events-none"
    >
      💬 {latest.text}
    </div>
  );
}
