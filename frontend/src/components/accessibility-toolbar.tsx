import { useA11y } from "@/lib/accessibility-context";
import { useState } from "react";

export function AccessibilityToolbar() {
  const a11y = useA11y();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open accessibility settings"
        aria-expanded={open}
        className="rounded-full border-2 border-primary bg-card px-3 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition flex items-center gap-2"
      >
        ♿ Access
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Accessibility settings"
          className="absolute right-0 mt-2 w-72 rounded-2xl border-2 border-primary bg-card p-4 shadow-soft z-50 space-y-4"
        >
          <div>
            <div className="text-xs font-bold uppercase mb-2">Text size</div>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => a11y.setFontScale(s as 1 | 2 | 3)}
                  aria-label={`Text size ${s === 1 ? "normal" : s === 2 ? "large" : "extra large"}`}
                  aria-pressed={a11y.fontScale === s}
                  className={`flex-1 rounded-lg border-2 py-2 font-bold ${
                    a11y.fontScale === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  A{s === 1 ? "" : s === 2 ? "+" : "++"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={a11y.toggleHighContrast}
            aria-pressed={a11y.highContrast}
            className={`w-full rounded-lg border-2 py-2 font-bold ${
              a11y.highContrast ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}
          >
            {a11y.highContrast ? "✓ " : ""}High Contrast
          </button>

          <button
            onClick={a11y.toggleHoverToSpeak}
            aria-pressed={a11y.hoverToSpeak}
            className={`w-full rounded-lg border-2 py-2 font-bold ${
              a11y.hoverToSpeak ? "bg-accent text-accent-foreground border-accent" : "border-border hover:bg-muted"
            }`}
          >
            {a11y.hoverToSpeak ? "✓ " : ""}Hover to Speak
          </button>

          <button
            onClick={() => a11y.setCaptionsVisible(!a11y.captionsVisible)}
            aria-pressed={a11y.captionsVisible}
            className={`w-full rounded-lg border-2 py-2 font-bold ${
              a11y.captionsVisible ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}
          >
            {a11y.captionsVisible ? "✓ " : ""}Live Captions
          </button>

          <div>
            <div className="text-xs font-bold uppercase mb-2">Language</div>
            <select
              value={a11y.language}
              onChange={(e) => a11y.setLanguage(e.target.value)}
              aria-label="Choose language"
              className="w-full rounded-lg border-2 border-border bg-background py-2 px-3 font-medium"
            >
              {["English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
