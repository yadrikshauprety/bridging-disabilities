import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";

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

  setDisability: (d: DisabilityType) => void;
  setLanguage: (l: string) => void;
  setLocation: (l: string) => void;
  setFontScale: (s: FontScale) => void;
  toggleHighContrast: () => void;
  toggleHoverToSpeak: () => void;
  setCaptionsVisible: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  setConsented: (v: boolean) => void;

  speak: (text: string, source?: CaptionSource) => void;
  pushCaption: (text: string, source?: CaptionSource) => void;
  clearCaptions: () => void;
  stopSpeaking: () => void;
}

const Ctx = createContext<AccessibilityState | null>(null);

const STORAGE_KEY = "db_a11y_v1";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [disability, setDisabilityState] = useState<DisabilityType>(null);
  const [language, setLanguage] = useState("English");
  const [location, setLocation] = useState("");
  const [fontScale, setFontScaleState] = useState<FontScale>(1);
  const [highContrast, setHighContrast] = useState(false);
  const [hoverToSpeak, setHoverToSpeak] = useState(true);
  const [captionsVisible, setCaptionsVisibleState] = useState(true);
  const [captions, setCaptions] = useState<CaptionLine[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [consented, setConsented] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const lastSpokenRef = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  // Hydrate from localStorage
  useEffect(() => {
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
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ disability, language, location, fontScale, highContrast, hoverToSpeak, captionsVisible, onboarded, consented })
      );
    } catch {}
  }, [disability, language, location, fontScale, highContrast, hoverToSpeak, captionsVisible, onboarded, consented, hydrated]);

  // Apply CSS classes for font scale + contrast
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.classList.remove("fs-1", "fs-2", "fs-3");
    html.classList.add(`fs-${fontScale}`);
    html.classList.toggle("hc", highContrast);
  }, [fontScale, highContrast]);

  // Hearing-impaired users: captions must be visible
  const captionsEnabled = disability === "hearing" || captionsVisible;

  // Unlock audio context on first interaction (fixes browser blocking Voice on Hover)
  useEffect(() => {
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

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const pushCaption = useCallback((text: string, source: CaptionSource = "system") => {
    if (!text) return;
    setCaptions((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, source, ts: Date.now() }];
      return next.slice(-200);
    });
  }, []);

  const speak = useCallback(
    (text: string, source: CaptionSource = "system") => {
      if (!text) return;
      // Always show as caption
      pushCaption(text, source);

      // Hearing-impaired: never speak audibly
      if (disability === "hearing") return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

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

  const clearCaptions = useCallback(() => setCaptions([]), []);

  const setDisability = useCallback((d: DisabilityType) => {
    setDisabilityState(d);
    if (d === "hearing") {
      setCaptionsVisibleState(true);
    }
  }, []);

  const setFontScale = useCallback((s: FontScale) => setFontScaleState(s), []);
  const toggleHighContrast = useCallback(() => setHighContrast((v) => !v), []);
  const toggleHoverToSpeak = useCallback(() => setHoverToSpeak((v) => !v), []);
  const setCaptionsVisible = useCallback((v: boolean) => setCaptionsVisibleState(v), []);

  const value: AccessibilityState = {
    disability, language, location, fontScale, highContrast, hoverToSpeak,
    captionsEnabled, captionsVisible, captions, onboarded, consented,
    setDisability, setLanguage, setLocation, setFontScale,
    toggleHighContrast, toggleHoverToSpeak, setCaptionsVisible,
    setOnboarded, setConsented,
    speak, pushCaption, clearCaptions, stopSpeaking,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useA11y() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useA11y must be used within AccessibilityProvider");
  return v;
}
