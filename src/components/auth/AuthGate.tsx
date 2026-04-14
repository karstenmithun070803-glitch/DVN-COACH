"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Invalid credentials");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/dvn-logo-2.png"
            alt="DVN Coach Warriors"
            width={100}
            height={116}
            className="object-contain drop-shadow-md mb-5"
            priority
          />
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest text-center leading-tight">
            DVN Coach Builders
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            Workshop CRM — Warriors Since 1972
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 space-y-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">
            Sign In to Continue
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-4 py-2.5 text-center">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-700/60 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-md shadow-teal-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-300 mt-6 uppercase tracking-widest">
          DVN Coach Builders · Karur
        </p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isChecked } = useAuth();

  // Wait for localStorage check to complete — prevents flash
  if (!isChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!isLoggedIn) return <LoginPage />;

  return <>{children}</>;
}
