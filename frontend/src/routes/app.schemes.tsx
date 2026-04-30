import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useA11y } from "@/lib/accessibility-context";

export const Route = createFileRoute("/app/schemes")({
  head: () => ({ meta: [{ title: "Scheme Entitlement Engine — DisabilityBridge" }] }),
  component: SchemesPage,
});

const PROGRESS_STEPS = [
  "Analyzing your profile...",
  "Generating search queries...",
  "Searching live government portals...",
  "Extracting matching schemes...",
  "Ranking by impact..."
];

function SchemesPage() {
  const a11y = useA11y();
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [schemes, setSchemes] = React.useState<any[]>([]);
  const [sources, setSources] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Form state pre-filled from a11y context
  const [profile, setProfile] = React.useState({
    disabilityType: a11y.disability || "Locomotor",
    severity: "40% or more",
    state: a11y.location || "Karnataka",
    age: 30,
    gender: "M",
    income: "BPL",
    employment: "Unemployed"
  });

  const runMatch = async () => {
    setLoading(true);
    setError(null);
    setSchemes([]);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => (p < 4 ? p + 1 : p));
    }, 1500);

    try {
      const res = await fetch("http://localhost:5000/api/schemes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (res.ok) {
        setSchemes(data.schemes || []);
        setSources(data.sources || []);
        a11y.speak(`Found ${data.schemes?.length || 0} matching schemes for you.`, "assistant");
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError("Backend connection failed. Please ensure the server is running.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">🏛️ Scheme Entitlement Engine</h1>
          <p className="text-muted-foreground mt-1 text-lg italic">"What am I owed?" — Real-time AI matching for Indian government schemes.</p>
        </div>
        {!loading && schemes.length > 0 && (
          <button onClick={() => window.print()} className="rounded-xl border-2 border-border px-6 py-2 font-bold hover:bg-muted transition">
            🖨️ Print Report
          </button>
        )}
      </header>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
        {/* Input Form */}
        <div className="space-y-6">
          <section className="rounded-3xl border-2 border-border bg-card p-6 shadow-soft space-y-6">
            <h2 className="font-black text-xl flex items-center gap-2">🔍 Your Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Disability Type</label>
                <select 
                  value={profile.disabilityType}
                  onChange={e => setProfile({...profile, disabilityType: e.target.value})}
                  className="w-full rounded-xl border-2 border-border bg-background p-3 font-bold focus:border-primary transition"
                >
                  <option>Locomotor</option>
                  <option>Visual Impairment</option>
                  <option>Hearing Impairment</option>
                  <option>Speech & Language</option>
                  <option>Intellectual Disability</option>
                  <option>Multiple Disabilities</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Age</label>
                  <input 
                    type="number"
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value)})}
                    className="w-full rounded-xl border-2 border-border bg-background p-3 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Gender</label>
                  <select 
                    value={profile.gender}
                    onChange={e => setProfile({...profile, gender: e.target.value})}
                    className="w-full rounded-xl border-2 border-border bg-background p-3 font-bold"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="T">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">State</label>
                <input 
                  value={profile.state}
                  onChange={e => setProfile({...profile, state: e.target.value})}
                  className="w-full rounded-xl border-2 border-border bg-background p-3 font-bold"
                  placeholder="e.g. Karnataka"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">Income Group</label>
                <select 
                  value={profile.income}
                  onChange={e => setProfile({...profile, income: e.target.value})}
                  className="w-full rounded-xl border-2 border-border bg-background p-3 font-bold"
                >
                  <option value="BPL">BPL (Below Poverty Line)</option>
                  <option value="lt3">Less than 3 Lakhs</option>
                  <option value="lt5">3 - 5 Lakhs</option>
                  <option value="gt5">Above 5 Lakhs</option>
                </select>
              </div>
            </div>

            <button 
              onClick={runMatch}
              disabled={loading}
              className="w-full rounded-2xl bg-primary text-primary-foreground font-black py-5 text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
            >
              {loading ? "SEARCHING..." : "FIND ENTITLEMENTS →"}
            </button>
          </section>

          {loading && (
            <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-black text-xs uppercase tracking-widest text-primary">Live RAG Pipeline</span>
                <span className="text-xs font-bold text-primary">{Math.round((progress / 4) * 100)}%</span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${(progress / 4) * 100}%` }}
                />
              </div>
              <p className="text-center font-black text-lg animate-pulse">{PROGRESS_STEPS[progress]}</p>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border-2 border-sos bg-sos/10 p-6 text-sos font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          {!loading && schemes.length === 0 && !error && (
            <div className="rounded-3xl border-4 border-dashed border-border py-24 text-center opacity-40">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-xl font-bold">Fill your details and click search to discover <br/> your central and state entitlements.</p>
            </div>
          )}

          {!loading && schemes.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-black uppercase text-muted-foreground py-1 mr-2">Portals Searched:</span>
                {sources.slice(0, 8).map((s, i) => (
                  <span key={i} className="bg-muted px-3 py-1 rounded-full text-[10px] font-black border border-border">{s}</span>
                ))}
              </div>

              <div className="grid gap-6">
                {schemes.map((s, i) => (
                  <div key={i} className="group relative rounded-3xl border-2 border-border bg-card p-6 md:p-8 hover:border-primary transition-all shadow-sm hover:shadow-xl animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.type === 'Central' ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {s.type}
                          </span>
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.ministry}</span>
                        </div>
                        <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition">{s.name}</h3>
                      </div>
                      <div className="text-4xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition">
                        {s.tags?.includes('Pension') ? '💰' : s.tags?.includes('Scholarship') ? '🎓' : s.tags?.includes('Health') ? '🏥' : '📜'}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Benefit</span>
                        <p className="font-bold text-lg text-foreground">{s.benefit}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Eligibility</span>
                        <p className="font-bold text-muted-foreground">{s.eligibility}</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/50">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-2">How to Apply</span>
                      <p className="font-medium text-sm leading-relaxed">{s.howToApply}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {s.tags?.map((t: string, ti: number) => (
                          <span key={ti} className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/10">{t}</span>
                        ))}
                      </div>
                      <a 
                        href={s.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-black text-primary hover:underline"
                      >
                        Source Portal ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
