import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "candidate" | "employer" | "moderator";

interface AuthContextType {
  role: Role;
  userId: string;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("candidate");
  const [userId, setUserId] = useState<string>("pwd_candidate_1");

  useEffect(() => {
    const session = localStorage.getItem("db_session");
    if (session === "employer") {
      setRole("moderator"); // For community purposes, employers can act as mods or we can refine this
      setUserId("emp_1");
    } else {
      setRole("candidate");
      setUserId("pwd_candidate_1");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, userId, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) return { role: "candidate" as Role, userId: "pwd_candidate_1", setRole: () => {} };
  return context;
}
