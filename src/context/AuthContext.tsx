"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const SESSION_KEY = "dvn-auth-session";

type Role = "SUPER_ADMIN" | "STAFF";

interface Session {
  token: string;
  expires: number;
  role: Role;
  displayName: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isChecked: boolean;
  role: Role | null;
  displayName: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: Session = JSON.parse(raw);
        if (session.token && session.expires > Date.now()) {
          setIsLoggedIn(true);
          setRole(session.role ?? "SUPER_ADMIN");
          setDisplayName(session.displayName ?? "DVN Vijay");
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsChecked(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        const sessionRole: Role = data.role ?? "SUPER_ADMIN";
        const sessionDisplayName: string = data.displayName ?? "DVN Vijay";
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          token: data.token,
          expires: data.expires,
          role: sessionRole,
          displayName: sessionDisplayName,
        }));
        setIsLoggedIn(true);
        setRole(sessionRole);
        setDisplayName(sessionDisplayName);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Invalid credentials" };
    } catch {
      return { ok: false, error: "Network error — please try again" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    setRole(null);
    setDisplayName(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isChecked, role, displayName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
