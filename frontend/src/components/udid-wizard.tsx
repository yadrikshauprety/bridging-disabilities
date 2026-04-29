import { useState, useEffect } from "react";
import { useA11y } from "@/lib/accessibility-context";

const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Bengali", "Marathi", "Malayalam", "Gujarati", "Odia", "Punjabi", "Assamese"
];

const WIZARD_STEPS = [
  { title: "Select Language", desc: "Choose your preferred language for the application." },
  { title: "Aadhaar Verification", desc: "Verifying your details via Aadhaar (Consent required)." },
  { title: "Disability Details", desc: "Specify your disability type and severity." },
  { title: "Medical Authority", desc: "We've identified the closest medical authority for your assessment." },
  { title: "Checklist & Submit", desc: "Review your documents and submit the application." },
  { title: "Status Tracker", desc: "Track your application progress." }
];

export function UDIDWizard() {
  const a11y = useA11y();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("English");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("Draft");
  const [aadhaarData, setAadhaarData] = useState<any>(null);

  useEffect(() => {
    a11y.speak(WIZARD_STEPS[step].desc, "assistant");
  }, [step]);

  const nextStep = () => setStep(s => Math.min(s + 1, WIZARD_STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const simulateAadhaar = () => {
    setConsent(true);
    a11y.speak("Verifying Aadhaar... Details fetched successfully.", "assistant");
    setAadhaarData({ name: "Rajesh Kumar", dob: "15/05/1992", address: "Sector 4, Jaipur" });
    setTimeout(nextStep, 2000);
  };

  const pollStatus = () => {
    setStatus("Polling...");
    setTimeout(() => {
      setStatus("Sent to Medical Board");
      a11y.speak("Application status updated: Sent to Medical Board.", "assistant");
    }, 2000);
  };

  return (
    <div className="bg-card rounded-3xl border-2 border-border shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
        <h2 className="text-2xl font-black">UDID Application Navigator</h2>
        <div className="flex gap-2 mt-2">
          {WIZARD_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Step {step + 1}</span>
          <h3 className="text-3xl font-black mt-1">{WIZARD_STEPS[step].title}</h3>
          <p className="text-muted-foreground mt-2">{WIZARD_STEPS[step].desc}</p>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); a11y.speak(`Language set to ${l}`, "assistant"); }}
                className={`py-3 rounded-xl border-2 font-bold transition ${lang === l ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="text-center py-10">
            {!aadhaarData ? (
              <button
                onClick={simulateAadhaar}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition"
              >
                🔐 Verify with Aadhaar
              </button>
            ) : (
              <div className="bg-muted p-6 rounded-2xl text-left border-2 border-primary/20">
                <p className="font-bold text-primary mb-2">✅ Aadhaar Data Pre-filled</p>
                <p><strong>Name:</strong> {aadhaarData.name}</p>
                <p><strong>DOB:</strong> {aadhaarData.dob}</p>
                <p><strong>Address:</strong> {aadhaarData.address}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <select className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary">
              <option>Visual Impairment</option>
              <option>Hearing Impairment</option>
              <option>Locomotor Disability</option>
              <option>Intellectual Disability</option>
            </select>
            <input type="range" className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            <p className="text-right text-xs font-bold text-muted-foreground">Severity: 45%</p>
          </div>
        )}

        {step === 3 && (
          <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-2xl">
            <h4 className="font-black text-primary">District Medical Authority</h4>
            <p className="text-sm font-bold">SMS Medical College & Hospital, Jaipur</p>
            <p className="text-xs text-muted-foreground mt-1">Location: Jawahar Lal Nehru Marg, Jaipur, Rajasthan 302004</p>
            <button className="mt-4 text-xs font-black text-primary underline">VIEW ON MAP</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
             {["Aadhaar Copy", "Disability Certificate", "Photo"].map(d => (
               <div key={d} className="flex items-center justify-between p-4 bg-muted rounded-xl font-bold">
                 <span>{d}</span>
                 <span className="text-success">READY</span>
               </div>
             ))}
             <button onClick={() => { setStatus("Submitted"); nextStep(); }} className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black mt-4">
               SUBMIT APPLICATION
             </button>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-6">
            <div className="inline-block p-4 rounded-full bg-primary/10 text-primary text-4xl mb-4">
              ⌛
            </div>
            <h4 className="text-2xl font-black mb-1">Current Status</h4>
            <div className="text-primary font-black text-lg bg-primary/5 py-2 px-6 rounded-full inline-block">
              {status}
            </div>
            <p className="text-sm text-muted-foreground mt-4">Last checked: Just now</p>
            <button onClick={pollStatus} className="mt-6 font-bold text-primary hover:underline">
              Check Status Again
            </button>
          </div>
        )}

        <div className="flex justify-between mt-10 pt-6 border-t-2 border-border">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="px-6 py-2 font-bold text-muted-foreground disabled:opacity-30"
          >
            ← Back
          </button>
          {step < 4 && (
            <button
              onClick={nextStep}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black shadow-soft"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
