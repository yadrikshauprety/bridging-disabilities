import { Link } from "@tanstack/react-router";
import { LiveCaptionsPanel, CaptionBar } from "@/components/captions";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary-glow to-accent text-primary-foreground">
        <Link to="/" className="font-black text-2xl flex items-center gap-2" aria-label="Back to home">
          <span aria-hidden className="text-3xl">🌉</span> Udaan
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
