import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — DisabilityBridge" }] }),
  component: JobsPage,
});

function JobsPage() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                    <h2 className="font-black text-2xl">{j.title}</h2>
                    <p className="text-muted-foreground font-bold">{j.company}</p>
                    <p className="mt-3 text-sm">{j.description}</p>
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
