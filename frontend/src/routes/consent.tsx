import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { CaptionBar, LiveCaptionsPanel } from "@/components/captions";
import { ISLPanel } from "@/components/isl-panel";

export const Route = createFileRoute("/consent")({
  head: () => ({ meta: [{ title: "Consent — Udaan" }] }),
  component: Consent,
});

const TERMS = `Udaan is a free companion app for Persons with Disabilities in India.

By using this app, you agree:
1. We store your disability type, language, and location only on your device, to personalise the app.
2. You can use voice, captions, sign language, or Braille features at any time.
3. SOS will share your location with the contacts and centres you choose.
4. Government schemes and UDID information are guides only — final decisions are made by the government.
5. You can clear your data anytime from the Profile screen.

We will never share your information without your permission.`;

function Consent() {
  const a11y = useA11y();
  const navigate = useNavigate();
  const [showSign, setShowSign] = useState(false);

  function readAloud() {
    a11y.speak("Reading terms aloud. " + TERMS.replace(/\n+/g, ". "), "system");
  }

  function accept() {
    a11y.setConsented(true);
    a11y.speak("Thank you. Welcome to your portal.", "assistant");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-warm/30 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-card rounded-3xl border-2 border-border p-6 md:p-10 shadow-soft">
        <h1 className="text-3xl md:text-4xl font-black mb-2">A few simple promises</h1>
        <p className="text-muted-foreground mb-6">We wrote this in plain words. Read it, hear it, or see it in sign language.</p>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={readAloud}
            aria-label="Read the terms aloud"
            className="rounded-xl border-2 border-primary px-4 py-2 font-bold hover:bg-primary hover:text-primary-foreground transition"
          >
            🔊 Read aloud
          </button>
          <button
            onClick={() => setShowSign((v) => !v)}
            aria-label="Show terms in sign language"
            className="rounded-xl border-2 border-warm bg-warm/30 px-4 py-2 font-bold"
          >
            🤟 {showSign ? "Hide" : "Show"} sign language
          </button>
        </div>

        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed bg-muted/50 rounded-2xl p-5 border-2 border-border">
          {TERMS}
        </pre>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={accept}
            aria-label="Accept terms and enter portal"
            className="flex-1 rounded-2xl bg-primary text-primary-foreground font-black py-4 text-lg shadow-soft"
          >
            ✓ I agree — Enter Portal
          </button>
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            aria-label="Go back to onboarding"
            className="rounded-2xl border-2 border-border font-bold py-4 px-6"
          >
            ← Back
          </button>
        </div>
      </div>

      <LiveCaptionsPanel />
      <CaptionBar />
      {(showSign || a11y.disability === "hearing") && <ISLPanel autoOpen text="Reading terms" />}
    </div>
  );
}
