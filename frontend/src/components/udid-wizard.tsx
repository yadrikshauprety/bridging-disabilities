import { useState, useRef, useEffect } from "react";
import { useA11y } from "@/lib/accessibility-context";

const STEPS = [
  { title: "Aadhaar Pre-fill", desc: "Upload your Aadhaar card for quick auto-fill." },
  { title: "Personal Details", desc: "Review your personal details and enter your WhatsApp number." },
  { title: "Disability Details", desc: "Specify your disability type and state." },
  { title: "Smart Checklist", desc: "Your personalized list of required documents." },
  { title: "Medical Authority", desc: "Locate the nearest hospital for your assessment." },
  { title: "Review & Submit", desc: "Review everything and submit your application." },
  { title: "Status Tracker", desc: "Track your application progress." }
];

export function UDIDWizard() {
  const a11y = useA11y();
  const [step, setStep] = useState(0);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    address: "",
    phone: "",
    disabilityType: "Locomotor Disability",
    state: "Karnataka",
    district: "Bangalore Urban",
    age: "30"
  });

  // Generated Data State
  const [checklist, setChecklist] = useState<any[]>([]);
  const [authority, setAuthority] = useState<any>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [trackingStatus, setTrackingStatus] = useState("Draft");
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    a11y.speak(STEPS[step].desc, "assistant");
  }, [step]);

  useEffect(() => {
    const userId = localStorage.getItem("db_user_id") || "guest";
    fetch(`http://localhost:5000/api/udid/user/${userId}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("No app");
      })
      .then(data => {
        if (data && data.id) {
          setApplicationId(data.id);
          setTrackingStatus(data.status);
          setStep(6);
          a11y.speak(`You already have an active application. Status is ${data.status}.`, "assistant");
        }
      })
      .catch(() => {});
  }, []);

  const nextStep = async () => {
    setError(null);
    if (step === 2) {
      // Transitioning to Checklist - Generate it!
      await generateChecklist();
    } else if (step === 3) {
      // Transitioning to Medical Authority - Find it!
      await findAuthority();
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    a11y.speak("Reading Aadhaar card. Please wait.", "assistant");
    
    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/api/udid/extract-aadhaar", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        name: data.name || "",
        dob: data.dob || "",
        gender: data.gender || "",
        address: data.address || ""
      }));
      a11y.speak(`Aadhaar verified successfully. Name detected as ${data.name}.`, "assistant");
      setTimeout(() => setStep(1), 1500);
    } catch (err) {
      setError("Failed to read Aadhaar. Please proceed manually.");
      a11y.speak("Failed to read Aadhaar. Please proceed manually.", "system");
    }
    setLoading(false);
  };

  const generateChecklist = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/udid/generate-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disabilityType: formData.disabilityType,
          state: formData.state,
          age: parseInt(formData.age) || 30
        })
      });
      const data = await res.json();
      setChecklist(data.documents || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const findAuthority = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/udid/medical-authority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: formData.district,
          state: formData.state,
          disabilityType: formData.disabilityType
        })
      });
      const data = await res.json();
      setAuthority(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const submitApplication = async () => {
    setLoading(true);
    a11y.speak("Submitting your application.", "assistant");
    const userId = localStorage.getItem("db_user_id") || "guest";
    try {
      const res = await fetch("http://localhost:5000/api/udid/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          name: formData.name,
          phone: formData.phone,
          disabilityType: formData.disabilityType
        })
      });
      const data = await res.json();
      if (data.success) {
        setApplicationId(data.applicationId);
        setTrackingStatus("Submitted");
        a11y.speak("Application submitted successfully. Moving to tracker.", "assistant");
        setStep(6); // Move to tracker
      }
    } catch (err) {
      setError("Failed to submit application.");
    }
    setLoading(false);
  };



  return (
    <div className="bg-card rounded-3xl border-2 border-border shadow-soft overflow-hidden mb-20">
      <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
        <h2 className="text-2xl font-black">UDID Application Navigator</h2>
        <div className="flex gap-1 mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <span className="text-sm font-black text-primary tracking-widest uppercase">Step {step + 1} of {STEPS.length}</span>
          <h3 className="text-3xl font-black mt-1">{STEPS[step].title}</h3>
          <p className="text-muted-foreground mt-2 font-medium">{STEPS[step].desc}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive p-4 rounded-xl mb-6 font-bold">
            {error}
          </div>
        )}

        {/* Step 0: Aadhaar Upload */}
        {step === 0 && (
          <div className="text-center py-10 border-4 border-dashed border-primary/30 rounded-3xl bg-primary/5 hover:bg-primary/10 transition">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <div className="text-6xl mb-4">📸</div>
            <h4 className="text-xl font-bold mb-2">Upload Aadhaar Card</h4>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              We'll use Claude Vision AI to read your card and auto-fill your form to save you typing!
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black shadow-lg disabled:opacity-50"
            >
              {loading ? "Scanning with AI..." : "Select Image"}
            </button>
            <div className="mt-6">
              <button onClick={() => setStep(1)} className="text-sm font-bold text-muted-foreground hover:text-primary underline">
                Skip and enter manually
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground">Full Name (Auto-filled)</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground">Age/DOB</label>
                <input 
                  type="text" 
                  value={formData.dob || formData.age} 
                  onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground">Gender</label>
                <input 
                  type="text" 
                  value={formData.gender} 
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" 
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground">Address</label>
              <textarea 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary min-h-[80px]" 
              />
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 mt-6">
              <label className="text-sm font-black text-green-800">📱 WhatsApp Number (Optional)</label>
              <p className="text-xs text-green-700 mb-2">Just to receive live application updates on your phone.</p>
              <input 
                type="tel" 
                placeholder="whatsapp:+919999999999"
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 rounded-lg border-2 border-green-300 bg-white font-bold outline-none focus:border-green-500" 
              />
            </div>
          </div>
        )}

        {/* Step 2: Disability Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground">State</label>
              <select 
                value={formData.state}
                onChange={e => setFormData({...formData, state: e.target.value})}
                className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary"
              >
                <option>Karnataka</option>
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>Rajasthan</option>
                <option>Tamil Nadu</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground">District</label>
              <input 
                type="text" 
                value={formData.district}
                onChange={e => setFormData({...formData, district: e.target.value})}
                className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground">Disability Type</label>
              <select 
                value={formData.disabilityType}
                onChange={e => setFormData({...formData, disabilityType: e.target.value})}
                className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary"
              >
                <option>Locomotor Disability</option>
                <option>Visual Impairment</option>
                <option>Hearing Impairment</option>
                <option>Speech & Language</option>
                <option>Intellectual Disability</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Smart Checklist */}
        {step === 3 && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center animate-pulse">
                <div className="text-4xl mb-4">🧠</div>
                <p className="font-bold text-lg">AI is generating your personalized checklist...</p>
              </div>
            ) : checklist.length > 0 ? (
              checklist.map((doc, i) => (
                <div key={i} className="p-4 rounded-2xl border-2 border-border bg-muted flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-6 h-6 rounded-md accent-primary" />
                    <strong className="text-lg">{doc.name}</strong>
                    {doc.mandatory && <span className="bg-destructive text-destructive-foreground text-xs font-black px-2 py-1 rounded-lg uppercase">Required</span>}
                  </div>
                  <p className="text-sm text-muted-foreground ml-9"><strong>How to get:</strong> {doc.how_to_get}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No documents found. Please click next.</p>
            )}
          </div>
        )}

        {/* Step 4: Medical Authority */}
        {step === 4 && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center animate-pulse">
                <div className="text-4xl mb-4">🏥</div>
                <p className="font-bold text-lg">Finding nearest medical authority...</p>
              </div>
            ) : authority ? (
              <div className="bg-primary/5 border-2 border-primary p-6 rounded-3xl shadow-soft relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-10 translate-x-10"></div>
                <h4 className="font-black text-2xl text-primary mb-1">{authority.authority}</h4>
                <p className="text-lg font-bold mb-3">{authority.address}</p>
                <p className="inline-flex items-center gap-2 bg-background px-4 py-2 rounded-xl font-bold border-2 border-border">
                  📞 {authority.phone}
                </p>
                <div className="mt-6">
                  <button className="bg-primary text-primary-foreground font-black px-6 py-3 rounded-xl shadow-md hover:bg-primary/90 transition">
                    📍 View on Map
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4">
             <div className="bg-muted p-6 rounded-2xl border-2 border-border">
               <h4 className="font-black text-xl mb-4 border-b-2 border-border pb-2">Application Summary</h4>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div><strong className="text-muted-foreground block">Name</strong> <span className="font-bold text-lg">{formData.name || "N/A"}</span></div>
                 <div><strong className="text-muted-foreground block">Disability</strong> <span className="font-bold text-lg">{formData.disabilityType}</span></div>
                 <div><strong className="text-muted-foreground block">Hospital</strong> <span className="font-bold text-lg">{authority?.authority || "N/A"}</span></div>
                 <div><strong className="text-muted-foreground block">WhatsApp</strong> <span className="font-bold text-lg">{formData.phone || "Not provided"}</span></div>
               </div>
             </div>
             <button 
               onClick={submitApplication} 
               disabled={loading}
               className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-xl mt-4 shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
             >
               {loading ? "Submitting..." : "SUBMIT APPLICATION"}
             </button>
          </div>
        )}

        {/* Step 6: Status Tracker */}
        {step === 6 && (
          <div className="text-center py-6">
            <h4 className="text-xl font-black mb-6 text-muted-foreground">Application ID: <span className="text-primary">{applicationId}</span></h4>
            
            <div className="flex flex-col items-center gap-4 relative">
              {/* Tracker Timeline */}
              {["Submitted", "Under Medical Review", "Approved", "Card Generated"].map((status, index) => {
                const isActive = trackingStatus === status;
                const isPast = ["Submitted", "Under Medical Review", "Approved", "Card Generated"].indexOf(trackingStatus) > index;
                
                return (
                  <div key={status} className={`w-full max-w-sm flex items-center gap-4 p-4 rounded-2xl border-2 font-bold transition-all duration-500
                    ${isActive ? "bg-primary text-primary-foreground border-primary scale-105 shadow-xl" : 
                      isPast ? "bg-success/10 text-success border-success" : 
                      "bg-muted text-muted-foreground border-border opacity-50"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${isActive ? "bg-primary-foreground text-primary" : 
                        isPast ? "bg-success text-success-foreground" : "bg-border text-muted-foreground"}`}
                    >
                      {isPast ? "✓" : index + 1}
                    </div>
                    <span className="text-lg">{status}</span>
                  </div>
                )
              })}
            </div>

          </div>
        )}

        {/* Navigation */}
        {step > 0 && step < 6 && (
          <div className="flex justify-between mt-10 pt-6 border-t-2 border-border">
            <button
              onClick={prevStep}
              className="px-6 py-2 font-bold text-muted-foreground hover:bg-muted rounded-xl transition"
            >
              ← Back
            </button>
            {step < 5 && (
              <button
                onClick={nextStep}
                disabled={loading}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black shadow-soft hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Continue →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
