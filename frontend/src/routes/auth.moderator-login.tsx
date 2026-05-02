import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/moderator-login")({
  component: ModeratorLoginPage,
});

function ModeratorLoginPage() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded check for demo purposes
    if (password === "mod123") {
      localStorage.setItem("db_session", "moderator");
      toast.success("Welcome, Moderator");
      navigate({ to: "/moderator" });
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border-2 border-border p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <span className="text-5xl block mb-4">🛡️</span>
          <h1 className="text-3xl font-black">Moderator Portal</h1>
          <p className="text-muted-foreground mt-2 font-medium">Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Key</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 font-bold focus:border-primary outline-none transition"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl shadow-lg hover:translate-y-[-2px] transition active:scale-95"
          >
            Authenticate
          </button>
        </form>
        
        <button 
          onClick={() => navigate({ to: "/auth/sign-in" })}
          className="w-full text-center mt-6 text-sm font-bold text-muted-foreground hover:text-foreground transition"
        >
          Back to User Login
        </button>
      </div>
    </div>
  );
}
