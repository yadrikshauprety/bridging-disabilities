import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "KYC Profile — DisabilityBridge" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const email = typeof window !== "undefined" ? localStorage.getItem("db_user_id") : null;

  React.useEffect(() => {
    if (email) {
      fetch(`http://localhost:5000/api/user/profile/${email}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [email]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get("name"),
      aadhar: formData.get("aadhar"),
      pan: formData.get("pan"),
      trustedContact: formData.get("trustedContact"),
    };

    try {
      await fetch(`http://localhost:5000/api/user/profile/${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setProfile({ ...profile, ...updates });
      a11y.speak("Profile updated successfully.", "assistant");
    } catch (err) {
      alert("Failed to update profile");
    }
    setSaving(false);
  }

  async function triggerSOS() {
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:5000/api/user/sos/${email}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        a11y.speak("SOS WhatsApp alert sent to your trusted contact.", "system");
      } else {
        a11y.speak(data.error || "Failed to send SOS", "system");
      }
    } catch {
      a11y.speak("Could not reach SOS service.", "system");
    }
  }

  function logout() {
    localStorage.removeItem("db_user_id");
    localStorage.removeItem("db_session");
    a11y.setDisability(null);
    a11y.setOnboarded(false);
    navigate({ to: "/" });
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading your secure profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">👤 KYC Profile</h1>
          <p className="text-muted-foreground mt-1 text-lg">Securely manage your identity and emergency contacts.</p>
        </div>
        <button 
          onClick={logout}
          className="rounded-xl border-2 border-border px-6 py-2 font-bold hover:bg-muted transition"
        >
          Sign out
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Verification Status Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest text-primary mb-4">Verification Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">UDID Card</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${profile?.udidStatus === 'Approved' ? 'bg-green-500 text-white' : 'bg-warm text-warm-foreground'}`}>
                  {profile?.udidStatus || "Not Applied"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Aadhar Verified</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${profile?.aadhar ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {profile?.aadhar ? "Active" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-sos/20 bg-sos/5 p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest text-sos mb-4">Emergency SOS</h3>
            <p className="text-xs font-bold text-muted-foreground mb-4 italic">Sends a WhatsApp alert to your trusted contact instantly.</p>
            <button 
              onClick={triggerSOS}
              className="w-full rounded-2xl bg-sos text-white font-black py-4 shadow-lg hover:scale-105 transition animate-pulse-ring"
            >
              🚨 Trigger SOS
            </button>
          </div>
        </div>

        {/* KYC Form */}
        <div className="md:col-span-2">
          <form onSubmit={updateProfile} className="rounded-3xl border-2 border-border bg-card p-6 md:p-8 shadow-soft space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-tight text-muted-foreground">Full Name</label>
                <input name="name" defaultValue={profile?.name} className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-bold focus:border-primary transition" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-tight text-muted-foreground">Email Address</label>
                <input readOnly value={profile?.email} className="w-full rounded-xl border-2 border-border bg-muted px-4 py-3 font-bold opacity-70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-tight text-muted-foreground">Aadhar Number</label>
                <input name="aadhar" defaultValue={profile?.aadhar} placeholder="XXXX-XXXX-XXXX" className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-bold focus:border-primary transition" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-tight text-muted-foreground">PAN Number</label>
                <input name="pan" defaultValue={profile?.pan} placeholder="ABCDE1234F" className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-bold focus:border-primary transition" />
              </div>
              <div className="col-span-full space-y-2">
                <label className="text-sm font-black uppercase tracking-tight text-muted-foreground">Trusted Contact (WhatsApp Number)</label>
                <input name="trustedContact" defaultValue={profile?.trustedContact} placeholder="+91 XXX XXX XXXX" className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-bold focus:border-primary transition" />
                <p className="text-[10px] font-bold text-muted-foreground italic">Include country code (e.g., +91 for India).</p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-black py-4 shadow-xl hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving Details..." : "✓ Save KYC Details"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border-2 border-border bg-muted/30 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase text-muted-foreground">App Preferences</div>
              <div className="font-bold">Disability: <span className="capitalize text-primary">{profile?.disability || "—"}</span></div>
            </div>
            <button 
              onClick={() => navigate({ to: "/onboarding" })}
              className="text-xs font-black text-primary underline"
            >
              Re-run Onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
