import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { JOBS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — DisabilityBridge" }] }),
  component: JobsPage,
});

function JobsPage() {
  const a11y = useA11y();
  const [type, setType] = useState<string>("all");
  const [wfh, setWfh] = useState(false);
  const [isl, setIsl] = useState(false);

  const filtered = useMemo(() => JOBS.filter((j) => {
    if (type !== "all" && !j.suitable.includes(type)) return false;
    if (wfh && !j.wfh) return false;
    if (isl && !j.isl) return false;
    return true;
  }), [type, wfh, isl]);

  function readJob(j: typeof JOBS[number]) {
    a11y.speak(`${j.title} at ${j.company}, ${j.location}. Salary ${j.salary}. Accessibility score ${j.score} out of 100. ${j.description}`, "assistant");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">💼 Accessible Jobs</h1>
        <p className="text-muted-foreground">Only employers with verified accessibility scores. No token listings.</p>
      </header>

      <div className="rounded-2xl bg-card border-2 border-border p-4 flex flex-wrap gap-3 items-center">
        <label className="font-bold">For: </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by disability type"
          className="rounded-lg border-2 border-border bg-background px-3 py-2 font-medium"
        >
          <option value="all">All</option>
          <option value="visual">Visual</option>
          <option value="hearing">Hearing</option>
          <option value="locomotor">Locomotor</option>
          <option value="other">Other</option>
        </select>
        <Toggle label="🏠 Work from home" on={wfh} onClick={() => setWfh(!wfh)} />
        <Toggle label="🤟 ISL support" on={isl} onClick={() => setIsl(!isl)} />
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} jobs</span>
      </div>

      <ul className="space-y-3" aria-label="Job listings">
        {filtered.map((j) => (
          <li key={j.id}>
            <article className="rounded-2xl border-2 border-border bg-card p-5 hover:border-primary transition">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-xl">{j.title}</h2>
                    <span
                      aria-label={`Accessibility score ${j.score} out of 100`}
                      className={`rounded-full px-3 py-0.5 text-sm font-black ${j.score >= 90 ? "bg-success text-success-foreground" : j.score >= 75 ? "bg-warm text-warm-foreground" : "bg-muted"}`}
                    >
                      ♿ {j.score}/100
                    </span>
                  </div>
                  <p className="text-muted-foreground">{j.company} · {j.location} · <span className="font-bold text-foreground">{j.salary}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {j.wfh && <Tag>🏠 WFH</Tag>}
                    {j.wheelchair && <Tag>♿ Wheelchair OK</Tag>}
                    {j.isl && <Tag>🤟 ISL interpreter</Tag>}
                  </div>
                  <p className="mt-3 text-sm">{j.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { a11y.speak(`Application sent to ${j.company} for ${j.title}.`, "assistant"); }}
                    aria-label={`Apply to ${j.title} at ${j.company}`}
                    className="rounded-xl bg-primary text-primary-foreground font-bold px-5 py-2"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => readJob(j)}
                    aria-label={`Read ${j.title} aloud`}
                    className="rounded-xl border-2 border-border font-bold px-5 py-2 hover:border-primary"
                  >
                    🔊 Read aloud
                  </button>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`rounded-full px-3 py-2 border-2 font-bold text-sm ${on ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background"}`}
    >
      {on ? "✓ " : ""}{label}
    </button>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold rounded-full bg-muted px-2 py-0.5">{children}</span>;
}
