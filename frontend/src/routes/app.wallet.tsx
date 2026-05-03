import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useA11y } from "@/lib/accessibility-context";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({ meta: [{ title: "Digital Wallet — Udaan" }] }),
  component: DigitalWalletPage,
});

function DigitalWalletPage() {
  const a11y = useA11y();
  const t = useT();
  const [appData, setAppData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [tapping, setTapping] = React.useState(false);
  const [receipt, setReceipt] = React.useState<string | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("db_user_id") || "user_1" : "user_1";

  React.useEffect(() => {
    fetch(`http://localhost:5000/api/udid/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setAppData(data);
          if (data.status === "Card Generated" || data.status === "Approved") {
            a11y.speak("Digital Wallet loaded. Your e-UDID card is ready to use.", "assistant");
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  const simulateNFCTap = async () => {
    if (!appData?.id) return;
    setTapping(true);
    setReceipt(null);
    a11y.speak("Establishing secure NFC connection...", "assistant");
    
    // Simulate real-world delay for NFC handshake
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const res = await fetch(`http://localhost:5000/api/udid/verify-tap/${appData.id}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setReceipt(data.receipt);
        a11y.speak("Card verified successfully via NFC tap.", "system");
      } else {
        a11y.speak("NFC verification failed.", "system");
        alert("Verification failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      a11y.speak("NFC connection error.", "system");
    }
    setTapping(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // State 1: No Application
  if (!appData) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 text-center py-20">
        <div className="text-8xl mb-6">🪪</div>
        <h1 className="text-4xl font-black tracking-tight">{t("Digital Wallet")}</h1>
        <p className="text-muted-foreground text-xl">
          {t("You don't have an active UDID application. Apply for your Unique Disability ID to unlock your digital wallet.")}
        </p>
        <Link 
          to="/app/udid"
          className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition"
        >
          {t("Go to UDID Navigator")}
        </Link>
      </div>
    );
  }

  // State 2: Application Processing
  const isGenerated = appData.status === "Card Generated" || appData.status === "Approved";
  
  if (!isGenerated) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 text-center py-20">
        <div className="text-8xl mb-6 opacity-50">⏳</div>
        <h1 className="text-4xl font-black tracking-tight">{t("Card Pending")}</h1>
        <p className="text-muted-foreground text-xl font-medium">
          {t("Your UDID application is currently:")} <strong className="text-primary">{appData.status}</strong>.
        </p>
        <p className="text-sm font-bold text-muted-foreground">
          {t("Once approved by the Government, your digital identity card will appear here automatically.")}
        </p>
        <div className="p-6 bg-muted rounded-3xl border-2 border-border mt-8 text-left relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <p className="font-bold text-xs text-muted-foreground mb-1 uppercase tracking-widest">{t("Application Reference")}</p>
          <p className="font-black text-2xl text-primary">{appData.id}</p>
        </div>
      </div>
    );
  }

  // State 3: Card Generated / Approved
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header>
        <h1 className="text-4xl font-black tracking-tight">🪪 {t("Digital Wallet")}</h1>
        <p className="text-muted-foreground mt-1 text-lg font-medium">{t("Present this card for concessions or use NFC tap at government counters.")}</p>
      </header>

      {/* The ID Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#60a5fa] text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-4 border-white/20 p-8 sm:p-10 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_25px_60px_rgba(59,130,246,0.4)]">
        {/* Glassmorphic overlays */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 opacity-90">
                  <span className="text-2xl">🇮🇳</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Govt of India · Digital Identity</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter drop-shadow-md">Unique Disability ID</h2>
              </div>
              <div className="md:hidden bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                <QRCodeSVG value={`udid:${appData.id}:${appData.name}`} size={60} level="M" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{t("Cardholder Name")}</p>
                <p className="text-3xl font-black drop-shadow-sm tracking-tight">{appData.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{t("Disability Type")}</p>
                  <p className="text-lg font-bold">{t(appData.disabilityType)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{t("UDID Number")}</p>
                  <p className="text-lg font-black font-mono tracking-tighter">{appData.id}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-center justify-center bg-white p-6 rounded-[2rem] shadow-2xl shrink-0 self-center">
            <QRCodeSVG value={`udid:${appData.id}:${appData.name}`} size={160} level="H" includeMargin={false} />
            <p className="text-[9px] font-black text-black/40 mt-3 tracking-[0.3em] uppercase">Scan to Verify</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-[2rem] border-2 border-border p-8 shadow-soft">
          <h3 className="font-black text-xl mb-6 flex items-center gap-2">
            <span className="text-2xl">⚡</span> {t("Quick Concessions")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🚂", label: "Railway" },
              { icon: "🚌", label: "Bus Pass" },
              { icon: "🏥", label: "Hospital" },
              { icon: "📉", label: "Tax Rebate" }
            ].map(btn => (
              <button key={btn.label} className="flex flex-col items-center justify-center p-5 bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all duration-300 group">
                <span className="text-3xl mb-2 group-hover:scale-125 transition-transform">{btn.icon}</span>
                <span className="font-black text-xs uppercase tracking-widest">{t(btn.label)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-[2rem] border-2 border-primary/20 p-8 shadow-soft flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          
          {receipt ? (
            <div className="animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-success text-success-foreground rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-success/30">
                ✓
              </div>
              <h3 className="font-black text-xl text-success-foreground mb-1">{t("Identity Verified")}</h3>
              <p className="text-[10px] font-mono font-black text-muted-foreground bg-muted px-4 py-1 rounded-full uppercase tracking-tighter">{receipt}</p>
              <button 
                onClick={() => setReceipt(null)}
                className="mt-6 text-sm font-black text-primary hover:underline uppercase tracking-widest"
              >
                {t("Tap again")}
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-4">📶</div>
              <h3 className="font-black text-xl mb-3">{t("Govt Desk Handshake")}</h3>
              <p className="text-sm text-muted-foreground font-bold mb-8 leading-relaxed px-4">{t("Hold your device near the NFC reader at government counters to verify your identity.")}</p>
              
              <button 
                onClick={simulateNFCTap}
                disabled={tapping}
                className={`relative w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all duration-500 ${
                  tapping 
                    ? "bg-primary/20 text-primary cursor-wait" 
                    : "bg-primary text-primary-foreground hover:scale-[1.03] hover:shadow-primary/20"
                }`}
              >
                {tapping ? t("Establishing Secure Connection...") : t("TAP TO VERIFY")}
                {tapping && (
                  <span className="absolute inset-0 rounded-2xl border-4 border-primary animate-ping opacity-20"></span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
