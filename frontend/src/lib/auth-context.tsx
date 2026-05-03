import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "candidate" | "employer" | "moderator";

interface AuthContextType {
  role: Role;
  userId: string;
  userName: string;
  setRole: (role: Role) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("candidate");
  const [userId, setUserId] = useState<string>("pwd_candidate_1");
  const [userName, setUserName] = useState<string>("Anonymous User");

  const refreshAuth = () => {
    const session = localStorage.getItem("db_session");
    const storedId = localStorage.getItem("db_user_id");
    const storedName = localStorage.getItem("db_user_name");

    if (session === "employer") {
      setRole("moderator");
      setUserId(storedId || "emp_1");
      setUserName(storedName || "Employer Admin");
    } else {
      setRole("candidate");
      setUserId(storedId || "pwd_candidate_1");
      setUserName(storedName || "Candidate");
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ role, userId, userName, setRole, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) return { role: "candidate" as Role, userId: "pwd_candidate_1", setRole: () => {} };
  return context;
}
