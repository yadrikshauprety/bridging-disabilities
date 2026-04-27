import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { SCHEMES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/schemes")({
  head: () => ({ meta: [{ title: "Schemes — DisabilityBridge" }] }),
  component: SchemesPage,
});

function SchemesPage() {
  const a11y = useA11y();
  const [type, setType] = useState<string>(a11y.disability ?? "visual");
  const [severity, setSeverity] = useState(60);

  const eligible = useMemo(() => SCHEMES.filter((s) => s.forTypes.includes(type) && severity >= s.severityMin), [type, severity]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🏛️ What schemes am I owed?</h1>
        <p className="text-muted-foreground">Answer two simple questions and we'll match you to every benefit you qualify for.</p>
      </header>

      <div className="rounded-2xl bg-card border-2 border-border p-5 grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-bold">Your disability type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Disability type"
            className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3"
          >
            <option value="visual">Visual</option>
            <option value="hearing">Hearing</option>
            <option value="locomotor">Locomotor</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="font-bold">Severity: {severity}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            aria-label={`Disability severity ${severity} percent`}
            className="mt-3 w-full"
          />
          <div className="text-xs text-muted-foreground">Most schemes need 40% or more.</div>
        </label>
      </div>

      <p className="font-bold text-lg">{eligible.length} scheme{eligible.length === 1 ? "" : "s"} matched</p>

      <ul className="space-y-3" aria-label="Eligible schemes">
        {eligible.map((s) => (
          <li key={s.id}>
            <SchemeCard s={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SchemeCard({ s }: { s: typeof SCHEMES[number] }) {
  const a11y = useA11y();
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-2xl border-2 border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-black text-xl">{s.name}</h2>
          <p className="text-success-foreground bg-success/20 inline-block rounded-lg px-2 py-0.5 mt-1 font-bold text-sm">
            🎁 {s.benefit}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => a11y.speak(s.simple, "assistant")}
            aria-label={`Explain ${s.name} simply`}
            className="rounded-xl border-2 border-warm bg-warm/30 px-4 py-2 font-bold"
          >
            ✨ Explain simply
          </button>
          <button
            onClick={() => a11y.speak(`${s.name}. ${s.benefit}. Documents needed: ${s.docs.join(", ")}. Steps: ${s.steps.join(". ")}`, "assistant")}
            aria-label={`Read ${s.name} aloud`}
            className="rounded-xl border-2 border-primary px-4 py-2 font-bold hover:bg-primary hover:text-primary-foreground"
          >
            🔊 Read aloud
          </button>
        </div>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 text-sm font-bold underline"
      >
        {open ? "Hide" : "Show"} steps & documents
      </button>
      {open && (
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold mb-1">📄 Documents required</h3>
            <ul className="list-disc list-inside text-sm space-y-1">{s.docs.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-bold mb-1">📝 Steps to apply</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">{s.steps.map((d) => <li key={d}>{d}</li>)}</ol>
          </div>
        </div>
      )}
    </article>
  );
}
