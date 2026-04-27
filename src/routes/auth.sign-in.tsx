import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { CaptionBar, LiveCaptionsPanel } from "@/components/captions";

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
    a11y.speak("Signed in. Welcome back.", "assistant");
    navigate({ to: "/app" });
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

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground">
        <Link to="/" className="font-black text-2xl flex items-center gap-2" aria-label="Back to home">
          <span aria-hidden className="text-3xl">🌉</span> DisabilityBridge
        </Link>
        <div>
          <p className="text-3xl md:text-5xl font-black leading-tight">
            "Designed so I never feel left out."
          </p>
          <p className="mt-3 opacity-90">— Priya, 19 · Jaipur</p>
        </div>
        <div className="text-sm opacity-80">Voice. Captions. Sign. Braille. Built in.</div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
          <p className="text-muted-foreground mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
      <LiveCaptionsPanel />
      <CaptionBar />
    </div>
  );
}

export function Field({
  label, name, type = "text", placeholder, onSpeak,
}: { label: string; name: string; type?: string; placeholder?: string; onSpeak?: () => void }) {
  return (
    <label className="block">
      <span className="font-bold block mb-1">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        aria-label={label}
        onMouseEnter={onSpeak}
        onFocus={onSpeak}
        className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus:border-primary"
      />
    </label>
  );
}
