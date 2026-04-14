"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const SESSION_KEY = "dvn-auth-session";

interface Session {
  token: string;
  expires: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isChecked: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // On mount, check localStorage for a valid unexpired session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session: Session = JSON.parse(raw);
        if (session.token && session.expires > Date.now()) {
          setIsLoggedIn(true);
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
        localStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, expires: data.expires }));
        setIsLoggedIn(true);
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
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isChecked, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
