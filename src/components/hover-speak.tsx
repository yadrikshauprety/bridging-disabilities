import { useEffect, useRef } from "react";
import { useA11y } from "@/lib/accessibility-context";

/**
 * Global hover/focus narrator. When "Hover to Speak" is on, ANY text under
 * the cursor (buttons, links, headings, paragraphs, list items, labels,
 * spans with text) is read aloud and pushed to captions.
 *
 * For non-interactive elements we still narrate so blind / low-vision /
 * cognitively-disabled users always get audio feedback wherever they hover —
 * which is the whole point of an assistive companion.
 */
export function HoverSpeakRoot({ children }: { children: React.ReactNode }) {
  const { hoverToSpeak, speak } = useA11y();
  const lastRef = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  useEffect(() => {
    if (!hoverToSpeak) return;

    const SKIP_TAGS = new Set(["HTML", "BODY", "SCRIPT", "STYLE", "SVG", "PATH", "VIDEO", "CANVAS"]);

    const getName = (el: Element | null): string => {
      if (!el || SKIP_TAGS.has(el.tagName)) return "";
      // Prefer ARIA labels
      const aria = el.getAttribute?.("aria-label");
      if (aria) return aria.trim().slice(0, 200);
      const labelledBy = el.getAttribute?.("aria-labelledby");
      if (labelledBy) {
        const ref = document.getElementById(labelledBy);
        if (ref?.textContent) return ref.textContent.trim().slice(0, 200);
      }
      // Image alt
      if (el.tagName === "IMG") {
        const alt = (el as HTMLImageElement).alt;
        if (alt) return alt;
      }
      // Form controls — read placeholder / value
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        const ph = (el as HTMLInputElement).placeholder;
        const lbl = (el as HTMLInputElement).labels?.[0]?.textContent;
        return (lbl || ph || "Text field").trim().slice(0, 200);
      }
      // Walk up to find the smallest meaningful text container
      let node: Element | null = el;
      let hops = 0;
      while (node && hops < 4) {
        if (SKIP_TAGS.has(node.tagName)) return "";
        const own = (node as HTMLElement).innerText?.trim();
        if (own && own.length > 0 && own.length < 400) {
          // Take first line / sentence
          const first = own.split("\n")[0].trim();
          if (first) return first.slice(0, 200);
        }
        node = node.parentElement;
        hops++;
      }
      return "";
    };

    let lastTarget: Element | null = null;
    const handler = (e: Event) => {
      const t = e.target as Element | null;
      if (!t || t === lastTarget) return;
      lastTarget = t;
      const name = getName(t);
      if (!name) return;
      const now = Date.now();
      if (name === lastRef.current.text && now - lastRef.current.ts < 1200) return;
      lastRef.current = { text: name, ts: now };
      speak(name, "hover");
    };

    document.addEventListener("mouseover", handler);
    document.addEventListener("focusin", handler);
    return () => {
      document.removeEventListener("mouseover", handler);
      document.removeEventListener("focusin", handler);
    };
  }, [hoverToSpeak, speak]);

  return <>{children}</>;
}
