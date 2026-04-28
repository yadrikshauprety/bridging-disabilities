import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalLayout } from "@/components/portal-layout";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app")({
  component: AppGate,
});

function AppGate() {
  const a11y = useA11y();
  const navigate = useNavigate();

  // First-run gate: app cannot be used until the user tells us their
  // disability type, so the experience adapts before they see anything.
  useEffect(() => {
    const session = localStorage.getItem("db_session");
    if (!session) {
      navigate({ to: "/auth/sign-in", replace: true });
    } else if (session === "employer") {
      // Employers have their own dedicated page, not the PWD portal
      navigate({ to: "/employer", replace: true });
    } else if (!a11y.disability) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [a11y.disability, navigate]);

  // Auto-enable Hover-to-Speak the first time someone enters the app —
  // it's the whole point of the assistive companion. Users can turn it off
  // from the Access menu.
  useEffect(() => {
    const KEY = "db_hover_autostart";
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem(KEY) && !a11y.hoverToSpeak) {
      a11y.toggleHoverToSpeak();
      localStorage.setItem(KEY, "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!a11y.disability) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <p className="text-2xl font-black mb-2">Setting things up for you…</p>
          <p className="text-muted-foreground">Taking you to a quick 30-second setup.</p>
        </div>
      </div>
    );
  }

  return <PortalLayout />;
}
