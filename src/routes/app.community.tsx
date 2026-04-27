import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/community")({
  head: () => ({ meta: [{ title: "Community — DisabilityBridge" }] }),
  component: CommunityPage,
});

const POSTS = [
  { user: "Ravi · Pune", text: "Koramangala post office ramp is broken. Use side entrance until fixed." },
  { user: "Priya · Jaipur", text: "Zoho Chennai office had ISL interpreter ready for my interview. 10/10 experience." },
  { user: "Asha · Hubballi", text: "Got my UDID in 45 days using the wizard here. Thank you!" },
];

function CommunityPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">👥 Community</h1>
        <p className="text-muted-foreground">Tips, wins, and warnings — from PwDs across India.</p>
      </header>
      <ul className="space-y-3">
        {POSTS.map((p, i) => (
          <li key={i} className="rounded-2xl border-2 border-border bg-card p-5">
            <div className="font-bold text-sm text-primary">{p.user}</div>
            <p className="mt-1">{p.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
