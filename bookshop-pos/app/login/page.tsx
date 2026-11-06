"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import "./login.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reason = searchParams.get("reason");
  const securityNotice =
    reason === "reopened"
      ? "Terminal was closed. Please enter your credentials to verify your identity."
      : reason === "timeout"
      ? "Session locked due to 30 minutes of inactivity for security."
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Mark session active in window session storage (cleared when window is closed)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sharthri_pos_active_session", "true");
      }

      // Fetch session to determine role-based redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/sell");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-backdrop" />
      <div className="login-card">
        {/* Logo / Branding */}
        <div className="login-header">
          <div className="login-logo overflow-hidden bg-white p-1 border border-slate-200 dark:border-white/20 shadow-lg shadow-[#1ecbe1]/30">
            <Image
              src="/brand-logo.png"
              alt="Sharthri Bookshop"
              width={60}
              height={60}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="login-title">Sharthri Bookshop</h1>
          <p className="login-subtitle">Point of Sale System</p>
        </div>

        {/* Security / Reopen Notice */}
        {securityNotice && !error && (
          <div className="mb-4 p-3 rounded-xl bg-[#1ecbe1]/10 border border-[#1ecbe1]/30 text-[#0891b2] dark:text-[#1ecbe1] text-xs font-semibold flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <span>{securityNotice}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="login-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="login-error-icon"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              required
              autoComplete="email"
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="login-input"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <span className="login-button-loading">
                <svg
                  className="login-spinner"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="login-spinner-track"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="login-spinner-head"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-container">
          <div className="login-backdrop" />
          <div className="login-card p-6 sm:p-8 space-y-6 animate-pulse max-w-md w-full text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
              <div className="h-6 w-44 rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-36 rounded bg-slate-200/70 dark:bg-white/5" />
            </div>
            <div className="space-y-4 pt-2 text-left">
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-11 rounded-xl bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-11 rounded-xl bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="h-11 rounded-xl bg-slate-200 dark:bg-white/10 mt-6" />
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
