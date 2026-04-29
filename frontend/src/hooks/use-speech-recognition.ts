import * as React from "react";

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function useSpeechRecognition(opts?: { lang?: string; continuous?: boolean }) {
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const recognitionRef = React.useRef<any>(null);
  const onResultRef = React.useRef<((r: SpeechRecognitionResult) => void) | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.continuous = opts?.continuous ?? false;
    rec.interimResults = true;
    rec.lang = opts?.lang ?? "en-IN";

    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        setTranscript((prev) => (prev ? prev + " " : "") + finalText.trim());
        setInterim("");
        onResultRef.current?.({ transcript: finalText.trim(), isFinal: true });
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, [opts?.lang, opts?.continuous]);

  const start = React.useCallback((onResult?: (r: SpeechRecognitionResult) => void) => {
    if (!recognitionRef.current) return;
    onResultRef.current = onResult ?? null;
    setTranscript("");
    setInterim("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = React.useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setListening(false);
  }, []);

  const reset = React.useCallback(() => { setTranscript(""); setInterim(""); }, []);

  return { supported, listening, transcript, interim, start, stop, reset };
}
