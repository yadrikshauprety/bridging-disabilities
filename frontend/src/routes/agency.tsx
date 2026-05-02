import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useA11y } from "@/lib/accessibility-context";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function registerUDID(string memory aadhar, string memory udid) public",
  "function getUDID(string memory aadhar) public view returns (string memory)",
  "function isUDIDRegistered(string memory udid) public view returns (bool)"
];

export const Route = createFileRoute("/agency")({
  component: AgencyPortal,
});

function AgencyPortal() {
  const a11y = useA11y();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      a11y.speak("Government Agency Portal loaded.", "assistant");
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@gmail.com" && password === "password123") {
      setIsAuthenticated(true);
      setError("");
      connectWallet(); // Auto-trigger MetaMask on login
    } else {
      setError("Invalid credentials. Use admin@gmail.com / password123");
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/udid/applications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
    setLoading(false);
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setError("Please install MetaMask!");
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
      a11y.speak("Wallet connected successfully.", "assistant");
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet.");
    }
    setIsConnecting(false);
  };

  const registerOnBlockchain = async (aadhar: string, udid: string) => {
    if (!(window as any).ethereum) throw new Error("MetaMask not found");
    
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Check if Aadhaar is already registered
    const existingUDID = await contract.getUDID(aadhar);
    if (existingUDID && existingUDID !== "") {
      console.log("Aadhaar already registered on blockchain:", existingUDID);
      return "ALREADY_REGISTERED";
    }

    a11y.speak("Please sign the transaction to record this UDID on the blockchain.", "assistant");
    const tx = await contract.registerUDID(aadhar, udid);
    await tx.wait();
    return tx.hash;
  };

  const updateStatus = async (id: string, nextStatus: string, aadhar?: string) => {
    try {
      // If generating card, we must record on blockchain first
      if (nextStatus === "Card Generated") {
        if (!walletAddress) {
          setError("Please connect your wallet first!");
          return;
        }
        if (!aadhar) {
          setError("Aadhaar number not found for this application!");
          return;
        }

        try {
          // If Aadhaar is missing, use the UDID (id) as the key on blockchain
          // This ensures the transaction succeeds even if the user skipped Aadhaar OCR
          const aadharKey = aadhar || id;
          const txHash = await registerOnBlockchain(aadharKey, id);
          
          if (txHash === "ALREADY_REGISTERED") {
            console.log("Skipping blockchain write - already exists.");
            a11y.speak("This record is already verified on the blockchain. Proceeding with card generation.", "assistant");
          } else {
            console.log("Blockchain TX Hash:", txHash);
            a11y.speak(`Blockchain record created! TX: ${txHash.substring(0, 10)}...`, "assistant");
          }
        } catch (blockchainErr: any) {
          console.error("Blockchain error:", blockchainErr);
          setError(`Blockchain Error: ${blockchainErr.reason || blockchainErr.message}`);
          return;
        }
      }

      const res = await fetch(`http://localhost:5000/api/udid/simulate-status/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        a11y.speak(`Application ${id} status updated to ${nextStatus}. WhatsApp notification sent.`, "assistant");
        fetchApplications(); // refresh list
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8">
        <div className="bg-card p-10 rounded-3xl border-2 border-border shadow-soft w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">🏛️</h1>
            <h2 className="text-2xl font-black text-primary">Govt Agency Login</h2>
            <p className="text-muted-foreground font-medium text-sm mt-2">Authorized Personnel Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-lg text-center">{error}</div>}
            <div>
              <label className="text-sm font-bold text-muted-foreground">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border-2 border-border bg-background font-bold outline-none focus:border-primary" />
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black shadow-lg hover:scale-[1.02] transition mt-4">
              SECURE LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between bg-primary text-primary-foreground p-6 rounded-3xl shadow-soft">
          <div>
            <h1 className="text-3xl font-black">🏛️ GovtAgency Dashboard</h1>
            <p className="opacity-80 font-medium">UDID Application Monitoring & Approvals</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/verify" className="bg-primary-foreground/20 text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary-foreground/30 transition">
              🔍 Verify Ledger
            </Link>
            {walletAddress ? (
              <div className="bg-primary-foreground text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-primary-foreground text-primary px-4 py-2 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50"
              >
                {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            )}
            <div className="bg-primary-foreground text-primary px-4 py-2 rounded-xl font-bold">
              Evaluator Mode
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive text-sm font-bold p-4 rounded-2xl border-2 border-destructive/20 text-center animate-in fade-in slide-in-from-top-4">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 font-bold text-xl animate-pulse">Loading applications...</div>
        ) : (
          <div className="bg-card rounded-3xl border-2 border-border shadow-soft overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs tracking-widest">
                <tr>
                  <th className="p-4 font-black">App ID</th>
                  <th className="p-4 font-black">Applicant</th>
                  <th className="p-4 font-black">Aadhaar (Ledger Key)</th>
                  <th className="p-4 font-black">Disability</th>
                  <th className="p-4 font-black">Status</th>
                  <th className="p-4 font-black text-right">Actions (Triggers Ledger)</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border font-medium">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-bold">
                      No applications found. Submit one from the PwD portal first!
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/50 transition">
                      <td className="p-4 font-black text-primary">{app.id}</td>
                      <td className="p-4">
                        <div className="font-bold">{app.name}</div>
                        <div className="text-xs text-muted-foreground">{app.phone}</div>
                      </td>
                      <td className="p-4 font-mono text-xs">{app.aadhar || "N/A"}</td>
                      <td className="p-4">{app.disabilityType}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase
                          ${app.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'Under Medical Review' ? 'bg-orange-100 text-orange-800' :
                            app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {app.status === 'Submitted' && (
                          <button onClick={() => updateStatus(app.id, 'Under Medical Review')} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition">
                            Mark Review
                          </button>
                        )}
                        {app.status === 'Under Medical Review' && (
                          <button onClick={() => updateStatus(app.id, 'Approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition">
                            Approve
                          </button>
                        )}
                         {app.status === 'Approved' && (
                          <button 
                            onClick={() => updateStatus(app.id, 'Card Generated', app.aadhar)} 
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>⛓️</span> Generate Card
                          </button>
                        )}
                        {app.status === 'Card Generated' && (
                          <span className="text-xs text-muted-foreground font-bold">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
