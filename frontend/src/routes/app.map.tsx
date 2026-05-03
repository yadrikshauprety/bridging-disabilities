import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

// Dynamically import the map component so it only runs in the browser
const ClientMap = React.lazy(() => import('@/components/ClientMap'));

export const Route = createFileRoute("/app/map")({
  head: () => ({ meta: [{ title: "Accessibility Map — Udaan" }] }),
  component: MapPage,
});

const FEATURE_ICONS: Record<string, string> = {
  rampLift: "♿", accessibleToilet: "🚻", brailleSignage: "⠿", audioAnnouncements: "🔊", parking: "🅿️",
};
const FEATURE_LABELS: Record<string, string> = {
  rampLift: "Ramp/Lift", accessibleToilet: "Accessible Toilet", brailleSignage: "Braille Signage", audioAnnouncements: "Audio Announcements", parking: "Accessible Parking",
};

// Add fallback constant for API
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function MapPage() {
  const a11y = useA11y();
  const sr = useSpeechRecognition();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Map state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.1259, 77.5898]); // Default Yelahanka, NMIT
  const [mapBounds, setMapBounds] = useState<[number, number][] | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ask for user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (err) => console.log("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Fetch places from API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch places from API
  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true);
      try {
        let url = `${BACKEND_URL}/api/maps/places`;
        if (debouncedQuery.trim().length > 2) {
          url = `${BACKEND_URL}/api/maps/search?q=${encodeURIComponent(debouncedQuery)}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Normalize coordinates for the mock visual map if needed, 
          // but for now let's just let it display in a list or roughly positioned
          setPlaces(data);
          
          if (data.length > 0) {
             const bounds: [number, number][] = data.map((p: any) => [p.lat, p.lng]);
             setMapBounds(bounds);
          }
        }
      } catch (err) {
        console.error("Failed to fetch places:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [debouncedQuery]);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      // Filtering logic applied on the client for the "feature" filters
      if (filter) {
        const conf = p.accessibility[filter];
        // Consider it 'having' the feature if confidence is > 50%
        if (conf === null || conf < 50) return false;
      }
      return true;
    });
  }, [places, filter]);

  function listen() {
    a11y.speak("Listening. Say something like find nearest hospital.", "assistant");
    sr.start((res) => {
      setQuery(res.transcript);
      a11y.speak(`Searching for ${res.transcript}`, "assistant");
    });
  }

  function readPlace(p: any) {
    const f = Object.entries(p.accessibility)
      .filter(([, v]) => typeof v === 'number' && v >= 50)
      .map(([k]) => FEATURE_LABELS[k])
      .join(", ");
      
    a11y.speak(`${p.name}, located at ${p.address || "unknown address"}. ${p.totalReviews} reviews. Accessibility features: ${f || "none reported"}.`, "assistant");
  }

  async function getDirections(destLat: number, destLng: number) {
    if (!userLocation) {
      a11y.speak("Opening Google Maps for directions.", "assistant");
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=walking`, '_blank');
      return;
    }

    a11y.speak("Opening Google Maps with your current location.", "assistant");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${destLat},${destLng}&travelmode=walking`, '_blank');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2">🗺️ Accessibility Map</h1>
        <p className="text-lg font-medium text-foreground/80">Crowdsourced ramp, lift, toilet, braille, and audio data — by PwDs, for PwDs.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hospitals, banks, metros, restaurants (min 3 chars)..."
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
        {/* Real Interactive Map */}
        <div
          role="img"
          aria-label="Interactive map of accessible places"
          className="relative aspect-[4/3] md:aspect-auto rounded-3xl border-2 border-border overflow-hidden z-0 bg-muted"
        >
          {isClient ? (
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center font-bold text-muted-foreground">Loading interactive map...</div>}>
              <ClientMap 
                mapCenter={mapCenter}
                mapBounds={mapBounds}
                userLocation={userLocation}
                filteredPlaces={filtered}
                selectedPlaceId={selected}
                route={route}
                onSelectPlace={(p) => {
                  setSelected(p.id);
                  readPlace(p);
                  setMapCenter([p.lat, p.lng]);
                }}
                onGetDirections={getDirections}
              />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-bold text-muted-foreground">Initializing map...</div>
          )}
          
          {loading && places.length === 0 && (
             <div className="absolute inset-0 z-10 flex items-center justify-center font-bold text-muted-foreground bg-card/50 pointer-events-none">
               Loading map data...
             </div>
          )}
          
          <div className="absolute bottom-3 right-3 z-10 bg-card/90 text-xs px-3 py-1 rounded-full font-bold border border-border shadow-soft pointer-events-none">
            OpenStreetMap Data · {filtered.length} places
          </div>
        </div>

        {/* List */}
        <ul className="space-y-3 max-h-[36rem] overflow-y-auto pr-1" aria-label="Place list">
          {loading && places.length === 0 ? (
             <p className="text-muted-foreground p-4">Loading...</p>
          ) : (
            filtered.map((p) => (
              <li key={p.id}>
                <PlaceCard 
                  place={p} 
                  selected={selected === p.id} 
                  onSelect={() => { 
                    setSelected(p.id); 
                    readPlace(p); 
                    setMapCenter([p.lat, p.lng]); 
                  }} 
                  onRead={() => readPlace(p)} 
                  onRoute={() => getDirections(p.lat, p.lng)}
                />
              </li>
            ))
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-muted-foreground italic p-4">No places found. Try a different search.</p>
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

function PlaceCard({ place, selected, onSelect, onRead, onRoute }: any) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  return (
    <article className={`rounded-3xl border-2 p-5 bg-card shadow-sm transition-all ${selected ? "border-accent ring-2 ring-accent ring-offset-2" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} aria-label={`Open ${place.name}`} className="text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <div className="font-extrabold text-xl text-foreground leading-tight">{place.name}</div>
          <div className="text-sm text-foreground/80 line-clamp-1 mt-1 font-medium">{place.address}</div>
          <div className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-extrabold flex items-center gap-1">
            <span className="bg-muted px-2 py-1 rounded-md">{place.type || "Location"}</span>
            <span className="px-1">•</span>
            <span>{place.totalReviews} reviews</span>
          </div>
        </button>
      </div>
      
      <div className="flex flex-col gap-2 mt-3" aria-label="Accessibility features">
        {Object.entries(place.accessibility).map(([k, v]) => {
          const confidence = v as number | null;
          let statusColor = "bg-muted text-foreground border-border";
          let statusText = "No data";
          
          if (confidence !== null) {
            if (confidence >= 50) {
              statusColor = "bg-success text-success-foreground border-success";
              statusText = `${confidence}% Yes`;
            } else {
              statusColor = "bg-sos text-sos-foreground border-sos";
              statusText = `${100 - confidence}% No`;
            }
          }
          
          return (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-2 font-bold ${confidence === null ? 'text-muted-foreground' : 'text-foreground'}`}>
                <span className={`text-base ${confidence === null ? 'opacity-50 grayscale' : ''}`}>{FEATURE_ICONS[k]}</span>
                <span>{FEATURE_LABELS[k]}</span>
              </span>
              <span className={`text-xs rounded-full px-3 py-1 font-extrabold border-2 shadow-sm ${statusColor}`}>
                {statusText}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-border/50">
        <button
          onClick={onRoute}
          aria-label={`Get directions to ${place.name}`}
          className="flex-1 min-w-[30%] text-sm rounded-xl bg-primary text-primary-foreground px-2 py-2.5 font-extrabold hover:opacity-90 transition-opacity shadow-sm"
        >
          📍 Route
        </button>
        <button
          onClick={onRead}
          aria-label={`Read ${place.name} details aloud`}
          className="flex-1 min-w-[20%] text-sm rounded-xl border-2 border-primary text-primary bg-card px-2 py-2.5 font-extrabold hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
        >
          🔊 Read
        </button>
        <button
          onClick={() => setShowReviewModal(true)}
          aria-label={`Add accessibility review for ${place.name}`}
          className="flex-1 min-w-[30%] text-sm rounded-xl bg-accent text-accent-foreground px-2 py-2.5 font-extrabold hover:opacity-90 transition-opacity shadow-sm"
        >
          ✍️ Review
        </button>
      </div>

      {showReviewModal && (
        <ReviewModal 
          place={place} 
          onClose={() => setShowReviewModal(false)} 
        />
      )}
    </article>
  );
}

function ReviewModal({ place, onClose }: { place: any, onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rampLift: null as number | null,
    accessibleToilet: null as number | null,
    brailleSignage: null as number | null,
    audioAnnouncements: null as number | null,
    parking: null as number | null,
    comments: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/maps/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: place.id,
          userId: "mock-user-id", // Hardcoded for demo
          placeDetails: place,
          ...formData
        }),
      });
      if (res.ok) {
        alert("Review submitted successfully!");
        onClose();
        // ideally trigger a refresh of the place here
      } else {
        alert("Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = (field: keyof typeof formData, val: number | null) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] === val ? null : val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-3xl border-2 border-border p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black mb-2">Review Access</h2>
        <p className="text-muted-foreground text-sm mb-6">{place.name}</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {Object.keys(FEATURE_ICONS).map((k) => {
            const key = k as keyof typeof formData;
            if (key === 'comments') return null;
            return (
              <div key={k} className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <span className="text-xl">{FEATURE_ICONS[k]}</span>
                  {FEATURE_LABELS[k]}
                </span>
                <div className="flex gap-1 bg-muted p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => handleToggle(key, 1)}
                    className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${formData[key] === 1 ? 'bg-success text-success-foreground' : 'hover:bg-background'}`}
                  >Yes</button>
                  <button 
                    type="button"
                    onClick={() => handleToggle(key, 0)}
                    className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${formData[key] === 0 ? 'bg-sos text-sos-foreground' : 'hover:bg-background'}`}
                  >No</button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <label className="block text-sm font-bold mb-2">Additional Comments</label>
            <textarea 
              value={formData.comments}
              onChange={e => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="E.g., Ramp is too steep..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-border font-bold hover:bg-muted"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
