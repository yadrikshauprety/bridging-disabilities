import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — DisabilityBridge" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const a11y = useA11y();
  const navigate = useNavigate();

  function reset() {
    if (typeof localStorage !== "undefined") localStorage.removeItem("db_a11y_v1");
    a11y.setDisability(null);
    a11y.setOnboarded(false);
    a11y.setConsented(false);
    navigate({ to: "/" });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">👤 Your Profile</h1>
        <p className="text-muted-foreground">Stored only on this device.</p>
      </header>

      <dl className="rounded-2xl border-2 border-border bg-card p-5 grid grid-cols-2 gap-3">
        {[
          ["Disability", a11y.disability ?? "—"],
          ["Language", a11y.language],
          ["Location", a11y.location || "—"],
          ["Text size", `A${a11y.fontScale === 1 ? "" : a11y.fontScale === 2 ? "+" : "++"}`],
          ["High contrast", a11y.highContrast ? "On" : "Off"],
          ["Hover to speak", a11y.hoverToSpeak ? "On" : "Off"],
        ].map(([k, v]) => (
          <div key={k as string}>
            <dt className="text-xs uppercase font-bold text-muted-foreground">{k}</dt>
            <dd className="font-bold capitalize">{v}</dd>
          </div>
        ))}
      </dl>

      <button
        onClick={reset}
        aria-label="Clear all my data and restart"
        className="rounded-xl border-2 border-sos text-sos font-bold px-5 py-3 hover:bg-sos hover:text-sos-foreground"
      >
        Clear my data & restart
      </button>
    </div>
  );
}
