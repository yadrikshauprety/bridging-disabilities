import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { AUDIT_QUESTIONS } from "@/lib/survey-questions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Udaan" }] }),
  component: JobsPage,
});

function JobsPage() {
  const a11y = useA11y();
  const t = useT();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  function readJob(j: any) {
    a11y.speak(`${j.title} at ${j.company}. ${j.description}`, "assistant");
  }

  function startInterview(jobId: string) {
    a11y.speak("Starting interview. Please ensure your camera is ready.", "system");
    navigate({ to: "/app/interview", search: { jobId } as any });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">💼 {t("Job Portal")}</h1>
        <p className="text-muted-foreground">{t("Find inclusive opportunities tailored to your profile.")}</p>
      </header>

      {loading ? (
        <p className="text-muted-foreground font-bold">{t("Loading jobs...")}</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground italic">{t("No jobs available at the moment.")}</p>
      ) : (
        <ul className="space-y-4" aria-label="Job listings">
          {jobs.map((j) => (
            <li key={j.id}>
              <article className="rounded-2xl border-2 border-border bg-card p-5 hover:border-primary transition">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-2xl">{j.title}</h2>
                      {j.hasBadge === 1 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                          <span className="text-sm">🛡️</span> {t("Disabled Friendly")}
                        </span>
                      )}
                    </div>
                     <p className="text-muted-foreground font-bold">{j.company}</p>
                    <p className="mt-3 text-sm">{j.description}</p>
                    
                    {expanded === j.id && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-xs font-black uppercase text-muted-foreground mb-3">Workplace Accessibility</h3>
                        <ul className="grid sm:grid-cols-2 gap-2 text-xs">
                          {AUDIT_QUESTIONS.map((q) => {
                            const flags = j.inclusionFlags || {};
                            const hasFeature = flags[q.id] === true;
                            return (
                              <li key={q.id} className={`flex items-start gap-2 ${!hasFeature ? "line-through text-muted-foreground opacity-50" : "font-bold text-primary"}`}>
                                <span>{hasFeature ? "✓" : "✕"}</span>
                                <span>{q.q}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startInterview(j.id)}
                      aria-label={`${t("Start Interview")} ${j.title}`}
                      className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-3 shadow-sm hover:opacity-90"
                    >
                      🎥 {t("Start Interview")}
                    </button>
                    <button
                      onClick={() => readJob(j)}
                      aria-label={`${t("Read aloud")} ${j.title}`}
                      className="rounded-xl border-2 border-border font-bold px-5 py-2 hover:border-primary"
                    >
                      🔊 {t("Read aloud")}
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition"
                    >
                      {expanded === j.id ? t("Hide Details") : t("View Accessibility Details")}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
