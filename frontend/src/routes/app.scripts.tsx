import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { toBraille, BRAILLE_LETTERS } from "@/lib/braille";
import { SIGN_PHRASES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/scripts")({
  head: () => ({ meta: [{ title: "Sign & Braille — DisabilityBridge" }] }),
  component: ScriptsPage,
});

function ScriptsPage() {
  const [tab, setTab] = useState<"sign" | "braille">("sign");
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🤟 Sign & Braille Scripts</h1>
        <p className="text-muted-foreground">Translate any text to ISL fingerspelling or Grade 1 Braille.</p>
      </header>

      <div role="tablist" aria-label="Script type" className="flex gap-2">
        {(["sign", "braille"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl border-2 px-5 py-3 font-bold capitalize ${tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
          >
            {t === "sign" ? "🤟 Sign" : "⠿ Braille"}
          </button>
        ))}
      </div>

      {tab === "sign" ? <SignTab /> : <BrailleTab />}
    </div>
  );
}

function SignTab() {
  const a11y = useA11y();
  const [text, setText] = useState("HELLO");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const letters = text.toUpperCase().split("");

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIdx((i) => {
        if (i >= letters.length - 1) { setPlaying(false); return 0; }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [playing, letters.length]);

  function play() { setIdx(0); setPlaying(true); a11y.speak(`Signing ${text}`, "assistant"); }
  function load(t: string) { setText(t); setIdx(0); }

  const current = letters[idx] ?? "";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <section className="rounded-2xl border-2 border-border bg-card p-5 space-y-3">
        <label className="block">
          <span className="font-bold">Type a message</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Message to fingerspell"
            className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3 text-lg uppercase"
          />
        </label>
        <button onClick={play} aria-label="Play sign animation" className="w-full rounded-xl bg-primary text-primary-foreground font-black py-3">
          ▶ Play sign
        </button>
        <div>
          <h3 className="font-bold mb-2 text-sm uppercase">Quick phrases</h3>
          <div className="flex flex-wrap gap-2">
            {SIGN_PHRASES.map((p) => (
              <button
                key={p.label}
                onClick={() => load(p.text)}
                aria-label={`Load phrase: ${p.label}`}
                className="rounded-full border-2 border-border bg-background px-3 py-1 text-sm font-bold hover:border-primary"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-warm bg-warm/20 p-5 flex flex-col items-center">
        <div className="text-xs font-bold uppercase mb-2">ISL Fingerspelling Avatar (mock)</div>
        <div className="aspect-square w-full max-w-xs bg-card rounded-3xl flex items-center justify-center text-[12rem] font-black text-primary border-2 border-border animate-float">
          {current || "🤟"}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1 max-w-xs">
          {letters.map((l, i) => (
            <span
              key={`${l}-${i}`}
              className={`h-8 w-8 grid place-items-center rounded font-black text-sm ${i === idx ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {l}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrailleTab() {
  const a11y = useA11y();
  const [text, setText] = useState("Hello India 2026");
  const braille = toBraille(text);

  function copy() {
    navigator.clipboard?.writeText(braille);
    a11y.speak("Braille copied to clipboard.", "assistant");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border-2 border-border bg-card p-5">
        <label className="block">
          <span className="font-bold">Type any text</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Text to convert to Braille"
            rows={3}
            className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3"
          />
        </label>
        <div className="mt-4 rounded-2xl bg-foreground text-background p-6 text-4xl md:text-5xl leading-relaxed font-mono break-words">
          {braille || "⠿"}
        </div>
        <button
          onClick={copy}
          aria-label="Copy Braille to clipboard"
          className="mt-3 rounded-xl border-2 border-primary px-5 py-2 font-bold hover:bg-primary hover:text-primary-foreground"
        >
          📋 Copy Braille
        </button>
      </section>

      <section className="rounded-2xl border-2 border-border bg-card p-5">
        <h3 className="font-black text-lg mb-3">A–Z Braille reference</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {Object.entries(BRAILLE_LETTERS).map(([l, b]) => (
            <div key={l} className="rounded-lg border-2 border-border bg-background p-2 text-center">
              <div className="text-3xl">{b}</div>
              <div className="text-xs font-bold uppercase mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
