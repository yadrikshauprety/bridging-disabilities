import { useEffect, useRef } from "react";
import { useA11y } from "@/lib/accessibility-context";

/**
 * Wraps children with a global hover/focus listener that, when "Hover to Speak"
 * is enabled, reads aria-label / text content of the targeted element aloud
 * and writes it to captions.
 */
export function HoverSpeakRoot({ children }: { children: React.ReactNode }) {
  const { hoverToSpeak, speak } = useA11y();
  const lastRef = useRef<string>("");

  useEffect(() => {
    if (!hoverToSpeak) return;

    const getName = (el: Element | null): string => {
      if (!el) return "";
      const tag = el.tagName.toLowerCase();
      if (!["button", "a", "input", "select", "textarea", "label", "summary"].includes(tag) &&
          !el.getAttribute("role")) return "";
      const aria = el.getAttribute("aria-label");
      if (aria) return aria;
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        const ref = document.getElementById(labelledBy);
        if (ref) return ref.textContent?.trim() || "";
      }
      const text = (el as HTMLElement).innerText?.trim();
      return text ? text.split("\n")[0].slice(0, 120) : "";
    };

    const handler = (e: Event) => {
      const target = (e.target as Element)?.closest("button, a, [role='button'], [role='link'], input, select, textarea, label, summary");
      const name = getName(target);
      if (!name || name === lastRef.current) return;
      lastRef.current = name;
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
