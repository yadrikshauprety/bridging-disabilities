import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { PLACES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Accessibility Map — DisabilityBridge" }] }),
  component: MapPage,
});

const FEATURE_ICONS: Record<string, string> = {
  ramp: "♿", lift: "🛗", accessibleToilet: "🚻", braille: "⠿", audio: "🔊",
};
const FEATURE_LABELS: Record<string, string> = {
  ramp: "Ramp", lift: "Lift", accessibleToilet: "Accessible Toilet", braille: "Braille", audio: "Audio Support",
};

function MapPage() {
  const a11y = useA11y();
  const sr = useSpeechRecognition();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PLACES.filter((p) => {
      if (query && !`${p.name} ${p.type} ${p.area}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter && !(p.features as any)[filter]) return false;
      return true;
    });
  }, [query, filter]);

  function listen() {
    a11y.speak("Listening. Say something like find nearest hospital.", "assistant");
    sr.start((res) => {
      setQuery(res.transcript);
      a11y.speak(`Searching for ${res.transcript}`, "assistant");
    });
  }

  function readPlace(p: typeof PLACES[number]) {
    const f = Object.entries(p.features).filter(([, v]) => v).map(([k]) => FEATURE_LABELS[k]).join(", ");
    a11y.speak(`${p.name}, a ${p.type} in ${p.area}. Rated ${p.rating} out of 5. Accessibility features: ${f || "none reported"}.`, "assistant");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🗺️ Accessibility Map</h1>
        <p className="text-muted-foreground">Crowdsourced ramp, lift, toilet, braille, and audio data — by PwDs, for PwDs.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals, banks, metros, restaurants…"
            aria-label="Search places"
            className="flex-1 rounded-xl border-2 border-border bg-card px-4 py-3 text-base"
          />
          <button
            onClick={listen}
            aria-label={sr.listening ? "Stop voice search" : "Voice search"}
            className={`rounded-xl border-2 px-4 font-bold ${sr.listening ? "bg-sos text-sos-foreground border-sos" : "border-primary"}`}
          >
            🎤
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by feature">
        <FilterChip label="All" active={filter === null} onClick={() => setFilter(null)} />
        {Object.keys(FEATURE_ICONS).map((k) => (
          <FilterChip key={k} label={`${FEATURE_ICONS[k]} ${FEATURE_LABELS[k]}`} active={filter === k} onClick={() => setFilter(filter === k ? null : k)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        {/* Mock map */}
        <div
          role="img"
          aria-label="Mock map of accessible places"
          className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-success/20 via-primary/10 to-warm/30 border-2 border-border overflow-hidden"
        >
          {/* Grid */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          {/* Roads */}
          <div className="absolute left-0 right-0 top-1/2 h-3 bg-card/80" />
          <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-card/80" />

          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelected(p.id); readPlace(p); }}
              aria-label={`${p.name}, ${p.type}, rating ${p.rating}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-xl font-black border-4 border-card shadow-soft ${
                selected === p.id ? "bg-accent text-accent-foreground scale-125" : "bg-primary text-primary-foreground"
              }`}
            >
              📍
            </button>
          ))}
          <div className="absolute bottom-3 right-3 bg-card/90 text-xs px-3 py-1 rounded-full font-bold border border-border">
            Mock map · {filtered.length} places
          </div>
        </div>

        {/* List */}
        <ul className="space-y-3 max-h-[36rem] overflow-y-auto pr-1" aria-label="Place list">
          {filtered.map((p) => (
            <li key={p.id}>
              <PlaceCard place={p} selected={selected === p.id} onSelect={() => { setSelected(p.id); readPlace(p); }} onRead={() => readPlace(p)} />
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground italic p-4">No matches. Try clearing filters.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={active}
      aria-label={`Filter: ${label}`}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
    >
      {label}
    </button>
  );
}

function PlaceCard({ place, selected, onSelect, onRead }: any) {
  const [reviewed, setReviewed] = useState(false);
  return (
    <article className={`rounded-2xl border-2 p-4 bg-card ${selected ? "border-accent" : "border-border"}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onSelect} aria-label={`Open ${place.name}`} className="text-left">
          <div className="font-bold text-lg">{place.name}</div>
          <div className="text-sm text-muted-foreground">{place.type} · {place.area}</div>
        </button>
        <div className="text-warm-foreground bg-warm/60 rounded-lg px-2 py-0.5 text-sm font-bold">★ {place.rating}</div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2" aria-label="Accessibility features">
        {Object.entries(place.features).map(([k, v]) => (
          <span
            key={k}
            aria-label={`${FEATURE_LABELS[k]}: ${v ? "available" : "not available"}`}
            className={`text-xs rounded-full px-2 py-0.5 font-bold ${v ? "bg-success/20 text-success-foreground border border-success" : "bg-muted text-muted-foreground line-through"}`}
          >
            {FEATURE_ICONS[k]} {FEATURE_LABELS[k]}
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onRead}
          aria-label={`Read ${place.name} details aloud`}
          className="text-sm rounded-lg border-2 border-primary px-3 py-1 font-bold hover:bg-primary hover:text-primary-foreground"
        >
          🔊 Read aloud
        </button>
        <button
          onClick={() => setReviewed(true)}
          aria-pressed={reviewed}
          aria-label={`Add accessibility review for ${place.name}`}
          className={`text-sm rounded-lg border-2 px-3 py-1 font-bold ${reviewed ? "bg-success text-success-foreground border-success" : "border-border"}`}
        >
          {reviewed ? "✓ Thanks!" : "Add review"}
        </button>
      </div>
    </article>
  );
}
