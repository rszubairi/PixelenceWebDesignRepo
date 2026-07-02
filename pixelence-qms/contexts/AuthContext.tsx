import React, { createContext, useContext, useState, useEffect } from "react";

export type QmsRole = "qms-manager" | "qms-director" | "qms-auditor" | "qms-staff" | "super-admin";

export interface QmsUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: QmsRole;
  isActive: boolean;
}

interface AuthContextValue {
  user: QmsUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

const STORAGE_KEY = "qms_user";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<QmsUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${CONVEX_URL.replace("convex.cloud", "convex.site")}/api/qms/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: data.user, token: data.token }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth(allowedRoles?: QmsRole[]) {
  const auth = useAuth();

  const isAuthorized =
    auth.user &&
    (!allowedRoles || allowedRoles.includes(auth.user.role));

  return { ...auth, isAuthorized: !!isAuthorized };
}
