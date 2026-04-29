import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { EMPLOYER_SURVEY_QUESTIONS } from "@/lib/survey-questions";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — DisabilityBridge" }] }),
  component: JobsPage,
});

function JobsPage() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("http://localhost:5000/api/jobs");
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
        <h1 className="text-3xl md:text-4xl font-black">💼 Accessible Jobs</h1>
        <p className="text-muted-foreground">Opportunities created by verified inclusive employers.</p>
      </header>

      {loading ? (
        <p className="text-muted-foreground font-bold">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground italic">No jobs available at the moment.</p>
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
                          <span className="text-sm">🛡️</span> Disabled Friendly
                        </span>
                      )}
                    </div>
                     <p className="text-muted-foreground font-bold">{j.company}</p>
                    <p className="mt-3 text-sm">{j.description}</p>
                    
                    {expanded === j.id && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-xs font-black uppercase text-muted-foreground mb-3">Workplace Accessibility</h3>
                        <ul className="grid sm:grid-cols-2 gap-2 text-xs">
                          {EMPLOYER_SURVEY_QUESTIONS.map((q, i) => {
                            const flags = j.inclusionFlags || {};
                            const hasFeature = flags[i] === true;
                            return (
                              <li key={i} className={`flex items-start gap-2 ${!hasFeature ? "line-through text-muted-foreground opacity-50" : "font-bold text-primary"}`}>
                                <span>{hasFeature ? "✓" : "✕"}</span>
                                <span>{q}</span>
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
                      aria-label={`Start interview for ${j.title} at ${j.company}`}
                      className="rounded-xl bg-primary text-primary-foreground font-black px-5 py-3 shadow-sm hover:opacity-90"
                    >
                      🎥 Start Interview
                    </button>
                    <button
                      onClick={() => readJob(j)}
                      aria-label={`Read ${j.title} aloud`}
                      className="rounded-xl border-2 border-border font-bold px-5 py-2 hover:border-primary"
                    >
                      🔊 Read aloud
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition"
                    >
                      {expanded === j.id ? "Hide Details" : "View Accessibility Details"}
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
