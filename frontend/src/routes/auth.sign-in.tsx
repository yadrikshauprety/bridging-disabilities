import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { AuthShell, Field } from "@/components/auth-ui";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({ meta: [{ title: "Sign In — DisabilityBridge" }] }),
  component: SignIn,
});

function SignIn() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [role, setRole] = useState<"user" | "employer">("user");

  function fieldHover(text: string) {
    return () => a11y.speak(text, "hover");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("db_session", role);
    if (role === "user") {
      a11y.speak("Signed in. Welcome back.", "assistant");
      navigate({ to: "/app/jobs" });
    } else {
      navigate({ to: "/app/employer" });
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue">
      <div role="tablist" aria-label="Account type" className="grid grid-cols-2 gap-2 mb-6">
        {(["user", "employer"] as const).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => { setRole(r); a11y.speak(`${r} account selected`, "assistant"); }}
            className={`rounded-xl border-2 py-3 font-bold capitalize ${role === r ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
          >
            {r === "user" ? "👤 Person with Disability" : "🏢 Employer"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email or phone" name="id" placeholder="you@example.com" onSpeak={fieldHover("Type your email or phone here")} />
        <Field label="Password" name="pw" type="password" placeholder="••••••••" onSpeak={fieldHover("Type your password here")} />
        <button
          type="submit"
          aria-label={`Sign in as ${role}`}
          className="w-full rounded-xl bg-primary text-primary-foreground font-black py-4 shadow-soft"
        >
          Sign in →
        </button>
        <p className="text-sm text-center text-muted-foreground">
          New here?{" "}
          <Link to="/auth/sign-up" className="font-bold text-primary underline">Create an account</Link>
        </p>
        <p className="text-xs text-center text-muted-foreground italic">
          Auth via Clerk will be wired in later. This is a friendly demo.
        </p>
      </form>
    </AuthShell>
  );
}

