import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { AuthShell, Field } from "@/components/auth-ui";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({ meta: [{ title: "Sign Up — DisabilityBridge" }] }),
  component: SignUp,
});

function SignUp() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [role, setRole] = useState<"user" | "employer">("user");

  function fieldHover(t: string) { return () => a11y.speak(t, "hover"); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("pw") as string;
    const name = formData.get("name") as string;
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("db_user_id", email);
        if (role === "user") {
          a11y.speak("Account created. Let's set up your accessibility profile.", "assistant");
          navigate({ to: "/onboarding" });
        } else {
          localStorage.setItem("db_session", "employer");
          // Clear previous audit state for fresh registration
          localStorage.removeItem("db_employer_badge");
          localStorage.removeItem("db_inclusion_flags");
          localStorage.removeItem("db_survey_skipped");
          navigate({ to: "/app/employer" });
        }
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      alert("Backend connection failed");
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Two minutes. We adapt the rest to you.">
      <div role="tablist" aria-label="Account type" className="grid grid-cols-2 gap-2 mb-6">
        {(["user", "employer"] as const).map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => { setRole(r); a11y.speak(`${r} account selected`, "assistant"); }}
            className={`rounded-xl border-2 py-3 font-bold capitalize ${role === r ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
          >
            {r === "user" ? "👤 PwD" : "🏢 Employer"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" name="name" placeholder="Your name" onSpeak={fieldHover("Type your full name")} />
        <Field label="Email" name="email" type="email" placeholder="you@example.com" onSpeak={fieldHover("Type your email address")} />
        <Field label="Password" name="pw" type="password" placeholder="At least 8 characters" onSpeak={fieldHover("Choose a password, at least 8 characters")} />
        {role === "employer" && (
          <Field label="Company name" name="company" placeholder="Acme Pvt Ltd" onSpeak={fieldHover("Type your company name")} />
        )}
        <button
          type="submit"
          aria-label="Create account"
          className="w-full rounded-xl bg-primary text-primary-foreground font-black py-4 shadow-soft"
        >
          Create account →
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-bold text-primary underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
