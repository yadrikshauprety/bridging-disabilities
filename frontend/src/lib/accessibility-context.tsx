import * as React from "react";
import { ReactNode } from "react";

export type DisabilityType = "visual" | "hearing" | "locomotor" | "other" | null;
export type FontScale = 1 | 2 | 3;
export type CaptionSource = "system" | "assistant" | "user" | "hover";

export interface CaptionLine {
  id: string;
  text: string;
  source: CaptionSource;
  ts: number;
}

interface AccessibilityState {
  disability: DisabilityType;
  language: string;
  location: string;
  fontScale: FontScale;
  highContrast: boolean;
  hoverToSpeak: boolean;
  captionsEnabled: boolean;
  captionsVisible: boolean;
  captions: CaptionLine[];
  onboarded: boolean;
  consented: boolean;
  wheelchairMode: boolean;

  setDisability: (d: DisabilityType) => void;
  setLanguage: (l: string) => void;
  setLocation: (l: string) => void;
  setFontScale: (s: FontScale) => void;
  toggleHighContrast: () => void;
  toggleHoverToSpeak: () => void;
  setCaptionsVisible: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  setConsented: (v: boolean) => void;
  setWheelchairMode: (v: boolean) => void;
  toggleWheelchairMode: () => void;

  speak: (text: string, source?: CaptionSource) => void;
  pushCaption: (text: string, source?: CaptionSource) => void;
  clearCaptions: () => void;
  stopSpeaking: () => void;
}

const Ctx = React.createContext<AccessibilityState | null>(null);

const STORAGE_KEY = "db_a11y_v1";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [disability, setDisabilityState] = React.useState<DisabilityType>(null);
  const [language, setLanguage] = React.useState("English");
  const [location, setLocation] = React.useState("");
  const [fontScale, setFontScaleState] = React.useState<FontScale>(1);
  const [highContrast, setHighContrast] = React.useState(false);
  const [hoverToSpeak, setHoverToSpeak] = React.useState(true);
  const [captionsVisible, setCaptionsVisibleState] = React.useState(true);
  const [captions, setCaptions] = React.useState<CaptionLine[]>([]);
  const [onboarded, setOnboarded] = React.useState(false);
  const [consented, setConsented] = React.useState(false);
  const [wheelchairMode, setWheelchairModeState] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  const lastSpokenRef = React.useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  // Hydrate from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.disability !== undefined) setDisabilityState(s.disability);
        if (s.language) setLanguage(s.language);
        if (s.location) setLocation(s.location);
        if (s.fontScale) setFontScaleState(s.fontScale);
        if (s.highContrast !== undefined) setHighContrast(s.highContrast);
        if (s.hoverToSpeak !== undefined) setHoverToSpeak(s.hoverToSpeak);
        if (s.captionsVisible !== undefined) setCaptionsVisibleState(s.captionsVisible);
        if (s.onboarded) setOnboarded(s.onboarded);
        if (s.consented) setConsented(s.consented);
        if (s.wheelchairMode !== undefined) setWheelchairModeState(s.wheelchairMode);
      }
    } catch {}
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ disability, language, location, fontScale, highContrast, hoverToSpeak, captionsVisible, onboarded, consented, wheelchairMode })
      );
    } catch {}
  }, [disability, language, location, fontScale, highContrast, hoverToSpeak, captionsVisible, onboarded, consented, wheelchairMode, hydrated]);

  // Apply CSS classes for font scale + contrast + disability
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.classList.remove("fs-1", "fs-2", "fs-3", "disability-visual", "disability-hearing", "disability-locomotor");
    html.classList.add(`fs-${fontScale}`);
    html.classList.toggle("hc", highContrast);
    if (disability) {
      html.classList.add(`disability-${disability}`);
    }
  }, [fontScale, highContrast, disability]);

  // Hearing-impaired users: captions must be visible
  const captionsEnabled = disability === "hearing" || captionsVisible;

  // Unlock audio context on first interaction (fixes browser blocking Voice on Hover)
  React.useEffect(() => {
    const unlockAudio = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(u);
        window.speechSynthesis.cancel();
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("pointerdown", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    document.addEventListener("pointerdown", unlockAudio);
    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("pointerdown", unlockAudio);
    };
  }, []);

  const stopSpeaking = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const pushCaption = React.useCallback((text: string, source: CaptionSource = "system") => {
    if (!text) return;
    setCaptions((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, source, ts: Date.now() }];
      return next.slice(-200);
    });
  }, []);

  const speak = React.useCallback(
    (text: string, source: CaptionSource = "system") => {
      if (!text) return;
      // Always show as caption
      pushCaption(text, source);

      // Hearing-impaired or Employer portal: never speak audibly
      if (disability === "hearing") return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (window.location.pathname.includes("/employer")) {
        // We still want captions, but no audio.
        return;
      }

      // De-dupe rapid identical calls (hover-to-speak fires repeatedly)
      const now = Date.now();
      if (lastSpokenRef.current.text === text && now - lastSpokenRef.current.ts < 800) return;
      lastSpokenRef.current = { text, ts: now };

      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.98;
        u.pitch = 1;
        u.volume = 1;
        u.lang = language === "Hindi" ? "hi-IN" : "en-IN";
        window.speechSynthesis.speak(u);
      } catch {}
    },
    [disability, language, pushCaption]
  );

  const clearCaptions = React.useCallback(() => setCaptions([]), []);

  const setDisability = React.useCallback((d: DisabilityType) => {
    setDisabilityState(d);
    if (d === "hearing") {
      setCaptionsVisibleState(true);
    }
  }, []);

  const setFontScale = React.useCallback((s: FontScale) => setFontScaleState(s), []);
  const toggleHighContrast = React.useCallback(() => setHighContrast((v) => !v), []);
  const toggleHoverToSpeak = React.useCallback(() => setHoverToSpeak((v) => !v), []);
  const setWheelchairMode = React.useCallback((v: boolean) => setWheelchairModeState(v), []);
  const toggleWheelchairMode = React.useCallback(() => setWheelchairModeState((v) => !v), []);
  const setCaptionsVisible = React.useCallback((v: boolean) => setCaptionsVisibleState(v), []);

  const value: AccessibilityState = {
    disability, language, location, fontScale, highContrast, hoverToSpeak,
    captionsEnabled, captionsVisible, captions, onboarded, consented, wheelchairMode,
    setDisability, setLanguage, setLocation, setFontScale,
    toggleHighContrast, toggleHoverToSpeak, setWheelchairMode, toggleWheelchairMode, setCaptionsVisible,
    setOnboarded, setConsented,
    speak, pushCaption, clearCaptions, stopSpeaking,
  };

  return <Ctx.Provider value={value}>{hydrated ? children : null}</Ctx.Provider>;
}

export function useA11y() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useA11y must be used within AccessibilityProvider");
  return v;
}
