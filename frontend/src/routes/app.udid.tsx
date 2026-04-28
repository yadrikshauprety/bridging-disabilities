import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { UDID_DOCUMENTS, UDID_STEPS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/udid")({
  head: () => ({ meta: [{ title: "UDID Navigator — DisabilityBridge" }] }),
  component: UDIDPage,
});

function UDIDPage() {
  const a11y = useA11y();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const progress = Math.round((Object.values(done).filter(Boolean).length / UDID_STEPS.length) * 100);

  function go(i: number) {
    setStep(i);
    a11y.speak(`Step ${i + 1}: ${UDID_STEPS[i].title}. ${UDID_STEPS[i].desc}`, "assistant");
  }

  function complete(i: number) {
    setDone((d) => ({ ...d, [i]: true }));
    a11y.speak(`Step ${i + 1} marked done.`, "assistant");
    if (i < UDID_STEPS.length - 1) go(i + 1);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🆔 UDID Application Wizard</h1>
        <p className="text-muted-foreground">A guided, voice-friendly walk through your Unique Disability ID application.</p>
      </header>

      <div className="rounded-2xl bg-card border-2 border-border p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold">Progress</span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="UDID application progress" className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid md:grid-cols-[20rem_1fr] gap-4">
        <ol className="space-y-2" aria-label="Application steps">
          {UDID_STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${s.title}${done[i] ? ", done" : ""}`}
                className={`w-full text-left rounded-xl border-2 p-3 transition ${
                  i === step ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-7 w-7 rounded-full grid place-items-center font-black text-sm ${done[i] ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {done[i] ? "✓" : i + 1}
                  </span>
                  <span className="font-bold">{s.title}</span>
                </div>
              </button>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border-2 border-border bg-card p-6">
          <h2 className="text-2xl font-black">Step {step + 1}: {UDID_STEPS[step].title}</h2>
          <p className="text-muted-foreground mt-1">{UDID_STEPS[step].desc}</p>

          {step === 2 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Document checklist</h3>
              <ul className="space-y-2">
                {UDID_DOCUMENTS.map((d) => (
                  <li key={d}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!docs[d]}
                        onChange={(e) => { setDocs({ ...docs, [d]: e.target.checked }); a11y.speak(`${d} ${e.target.checked ? "checked" : "unchecked"}`, "hover"); }}
                        aria-label={d}
                        className="h-5 w-5 accent-primary"
                      />
                      <span className={docs[d] ? "line-through text-muted-foreground" : ""}>{d}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => complete(step)}
              aria-label={`Mark step ${step + 1} as done`}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-5 py-3"
            >
              ✓ Mark done & continue
            </button>
            <button
              onClick={() => a11y.speak(`Step ${step + 1}. ${UDID_STEPS[step].title}. ${UDID_STEPS[step].desc}`, "assistant")}
              aria-label="Read this step aloud"
              className="rounded-xl border-2 border-primary px-5 py-3 font-bold"
            >
              🔊 Read aloud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
