import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useA11y, DisabilityType } from "@/lib/accessibility-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { CaptionBar, LiveCaptionsPanel } from "@/components/captions";
import { ISLPanel } from "@/components/isl-panel";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — DisabilityBridge" }] }),
  component: Onboarding,
});

const DISABILITIES: { id: Exclude<DisabilityType, null>; label: string; icon: string; desc: string }[] = [
  { id: "visual", label: "Visual (Blind / Low Vision)", icon: "👁️", desc: "We will switch to a voice-first experience." },
  { id: "hearing", label: "Hearing (Deaf / Hard of Hearing)", icon: "👂", desc: "Captions and sign language will be on everywhere." },
  { id: "locomotor", label: "Locomotor (Wheelchair / Mobility)", icon: "♿", desc: "Accessible jobs and routes prioritised." },
  { id: "other", label: "Other / Multiple", icon: "🤝", desc: "Standard accessible interface." },
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi"];

function Onboarding() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [voiceMode, setVoiceMode] = useState(false);
  const sr = useSpeechRecognition({ lang: "en-IN" });

  // When user picks Visual → activate voice mode and ask via audio
  useEffect(() => {
    if (a11y.disability === "visual" && !voiceMode) {
      setVoiceMode(true);
      a11y.speak("Voice mode is on. I will ask the questions, you can speak the answers.", "assistant");
    }
  }, [a11y.disability, voiceMode, a11y]);

  function pickDisability(d: Exclude<DisabilityType, null>) {
    a11y.setDisability(d);
    a11y.speak(`You selected ${d}. ${DISABILITIES.find(x => x.id === d)?.desc ?? ""}`, "assistant");
    setTimeout(() => setStep(1), 700);
  }

  function pickLanguage(l: string) {
    a11y.setLanguage(l);
    a11y.speak(`Language set to ${l}.`, "assistant");
    setTimeout(() => setStep(2), 500);
  }

  function setLocation(loc: string) {
    a11y.setLocation(loc);
    a11y.speak(`Location set to ${loc}. Taking you to consent.`, "assistant");
    a11y.setOnboarded(true);
    setTimeout(() => navigate({ to: "/consent" }), 800);
  }

  function listenForLocation() {
    a11y.speak("Please say your city or village.", "assistant");
    sr.start((res) => setLocation(res.transcript));
  }

  function listenForLanguage() {
    a11y.speak("Please say your language: English, Hindi, Tamil, Telugu, Kannada, Bengali, or Marathi.", "assistant");
    sr.start((res) => {
      const match = LANGUAGES.find((l) => res.transcript.toLowerCase().includes(l.toLowerCase()));
      pickLanguage(match || "English");
    });
  }

  function listenForDisability() {
    a11y.speak("Please say your disability: visual, hearing, locomotor, or other.", "assistant");
    sr.start((res) => {
      const t = res.transcript.toLowerCase();
      const match: DisabilityType =
        /(blind|visual|see|sight|eye)/.test(t) ? "visual" :
        /(deaf|hear|sound|ear)/.test(t) ? "hearing" :
        /(wheel|mobility|walk|locomot)/.test(t) ? "locomotor" :
        "other";
      pickDisability(match!);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm/30 via-background to-primary/10 px-4 py-8 md:py-14">
      <div className="max-w-3xl mx-auto">
        <ol aria-label="Onboarding progress" className="flex gap-2 mb-8">
          {["Disability", "Language", "Location"].map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className={`h-2 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
                aria-current={i === step ? "step" : undefined}
              />
              <div className="text-xs mt-1 font-bold">{label}</div>
            </li>
          ))}
        </ol>

        <div className="bg-card rounded-3xl border-2 border-border p-6 md:p-10 shadow-soft">
          {step === 0 && (
            <>
              <h1 className="text-3xl md:text-4xl font-black mb-2">Tell us about you</h1>
              <p className="text-muted-foreground mb-6">We'll adapt the entire app to your needs. You can change this later.</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {DISABILITIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => pickDisability(d.id)}
                    aria-label={`Select ${d.label}. ${d.desc}`}
                    className="text-left rounded-2xl border-2 border-border bg-background p-5 hover:border-primary hover:bg-primary/5 transition"
                  >
                    <div className="text-4xl mb-2" aria-hidden>{d.icon}</div>
                    <div className="font-bold text-lg">{d.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{d.desc}</div>
                  </button>
                ))}
              </div>

              {sr.supported && (
                <button
                  onClick={listenForDisability}
                  aria-label="Use voice to choose disability"
                  className="w-full rounded-xl border-2 border-accent bg-accent/30 py-3 font-bold mt-2"
                >
                  🎤 {sr.listening ? "Listening…" : "Or speak your answer"}
                </button>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-3xl md:text-4xl font-black mb-2">Choose your language</h1>
              <p className="text-muted-foreground mb-6">We will speak and write in this language.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => pickLanguage(l)}
                    aria-label={`Select ${l}`}
                    className={`rounded-xl border-2 py-4 font-bold ${a11y.language === l ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {sr.supported && (
                <button
                  onClick={listenForLanguage}
                  aria-label="Speak your language"
                  className="w-full rounded-xl border-2 border-accent bg-accent/30 py-3 font-bold mt-4"
                >
                  🎤 {sr.listening ? "Listening…" : "Or speak your language"}
                </button>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-3xl md:text-4xl font-black mb-2">Where are you?</h1>
              <p className="text-muted-foreground mb-6">We use this for nearby maps, jobs, and schemes.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (new FormData(e.currentTarget).get("loc") as string)?.trim();
                  if (v) setLocation(v);
                }}
                className="space-y-4"
              >
                <label htmlFor="loc" className="font-bold">Your city or village</label>
                <input
                  id="loc"
                  name="loc"
                  defaultValue={a11y.location}
                  required
                  aria-label="City or village"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-4 text-lg"
                  placeholder="e.g. Pune, Jaipur, Hubballi"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary text-primary-foreground font-black py-4"
                    aria-label="Continue to consent"
                  >
                    Continue →
                  </button>
                  {sr.supported && (
                    <button
                      type="button"
                      onClick={listenForLocation}
                      aria-label="Speak your location"
                      className="rounded-xl border-2 border-accent bg-accent/30 px-5 font-bold"
                    >
                      🎤
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {voiceMode && (
          <p role="status" aria-live="polite" className="text-center mt-4 text-sm text-muted-foreground">
            🔊 Voice mode is active. Use the mic buttons to speak your answers.
          </p>
        )}
      </div>

      <LiveCaptionsPanel />
      <CaptionBar />
      {a11y.disability === "hearing" && <ISLPanel autoOpen />}
    </div>
  );
}
