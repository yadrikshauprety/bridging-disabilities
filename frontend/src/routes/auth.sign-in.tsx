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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("id") as string;
    const password = formData.get("pw") as string;
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("db_user_id", email);
        localStorage.setItem("db_session", role);
        
        if (data.user.disability) a11y.setDisability(data.user.disability as any);
        if (data.user.location) a11y.setLocation(data.user.location);
        if (data.user.onboarded) a11y.setOnboarded(true);

        if (role === "user") {
          a11y.speak("Signed in. Welcome back.", "assistant");
          navigate({ to: "/app/jobs" });
        } else {
          navigate({ to: "/app/employer" });
        }
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      alert("Backend connection failed");
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
        <div className="pt-4 mt-4 border-t border-border flex justify-center">
          <Link to="/agency" className="text-xs font-black bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition">
            🏛️ Govt Agency Login
          </Link>
        </div>
        <p className="text-xs text-center text-muted-foreground italic">
          Auth via Clerk will be wired in later. This is a friendly demo.
        </p>
      </form>
    </AuthShell>
  );
}

