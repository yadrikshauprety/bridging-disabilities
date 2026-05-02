import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ethers } from "ethers";
import { GraffitiBackdrop } from "@/components/graffiti-backdrop";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function getUDID(string memory aadhar) public view returns (string memory)",
  "function isUDIDRegistered(string memory udid) public view returns (bool)"
];

export const Route = createFileRoute("/verify")({
  component: VerifyPortal,
});

function VerifyPortal() {
  const [searchType, setSearchType] = useState<"aadhar" | "udid">("aadhar");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ found: boolean; udid?: string; message: string; timestamp?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResult(null);

    try {
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      if (searchType === "aadhar") {
        const udid = await contract.getUDID(query);
        if (udid && udid !== "") {
          setResult({ 
            found: true, 
            udid, 
            message: "Immutable record verified on the Ethereum ledger.",
            timestamp: new Date().toLocaleString()
          });
        } else {
          setResult({ found: false, message: "No UDID found for this Aadhaar identity." });
        }
      } else {
        const exists = await contract.isUDIDRegistered(query);
        if (exists) {
          setResult({ 
            found: true, 
            message: "UDID certificate is authentic and active.",
            timestamp: new Date().toLocaleString()
          });
        } else {
          setResult({ found: false, message: "Certificate ID not recognized by the blockchain." });
        }
      }
    } catch (err) {
      console.error(err);
      setResult({ found: false, message: "Blockchain connection interrupted. Please ensure the local node is active." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm/20 via-background to-accent/10 text-slate-900 font-sans selection:bg-primary/20 relative overflow-hidden flex items-center justify-center p-4">
      <GraffitiBackdrop />

      <div className="w-full max-w-2xl relative z-10">
        <header className="text-center mb-8 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md border border-primary/20 px-4 py-1.5 rounded-full shadow-sm mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Ledger Verification</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            UDID <span className="text-primary italic underline decoration-accent/30 underline-offset-8">Explorer</span>
          </h1>
          <p className="text-muted-foreground font-bold text-sm max-w-md mx-auto">
            Blockchain-backed transparency for India's Divyangjan certificates.
          </p>
        </header>

        <div className="bg-card/80 backdrop-blur-2xl rounded-[2.5rem] border-2 border-primary/20 shadow-warm p-6 md:p-10 relative overflow-hidden">
          {/* Subtle Blockchain Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl mb-8">
            <button 
              onClick={() => { setSearchType("aadhar"); setResult(null); }}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${searchType === 'aadhar' ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' : 'text-muted-foreground hover:bg-background/80'}`}
            >
              Search Aadhaar
            </button>
            <button 
              onClick={() => { setSearchType("udid"); setResult(null); }}
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${searchType === 'udid' ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' : 'text-muted-foreground hover:bg-background/80'}`}
            >
              Search UDID
            </button>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="relative group">
              <div className="relative flex items-center">
                <div className="absolute left-6 text-2xl group-focus-within:scale-110 transition-transform">
                  {searchType === 'aadhar' ? "🆔" : "📜"}
                </div>
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={searchType === 'aadhar' ? "1234-5678-9012" : "UDXXXXX"}
                  className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-border bg-background font-black text-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !query}
              className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-lg shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-20 relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  VERIFYING...
                </div>
              ) : (
                "CONSULT BLOCKCHAIN LEDGER"
              )}
            </button>
          </form>

          {result && (
            <div className={`mt-8 overflow-hidden rounded-3xl border-2 animate-in zoom-in-95 duration-500 ${result.found ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-soft ${result.found ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                    {result.found ? "🛡️" : "⚠️"}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      {result.found ? "Certificate Verified" : "Entry Not Found"}
                    </h4>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      Status: {result.found ? "ON-CHAIN AUTHENTIC" : "UNRECOGNIZED"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className={`font-bold text-sm leading-relaxed ${result.found ? 'text-success-foreground' : 'text-destructive'}`}>
                    {result.message}
                  </p>

                  {result.found && result.udid && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-background/50 rounded-xl border border-border">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Registered UDID</span>
                        <span className="text-xl font-black text-primary tabular-nums">{result.udid}</span>
                      </div>
                      <div className="p-4 bg-background/50 rounded-xl border border-border">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Block Time</span>
                        <span className="text-[10px] font-black text-slate-600 uppercase leading-none">{result.timestamp}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">
            Immutable • Secure • Decentralized Ledger
          </p>
        </footer>
      </div>
    </div>
  );
}
