"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Maroon hero header with back button */}
      <div className="bg-maroon-gradient px-5 pt-4 pb-10 text-white rounded-b-[32px] relative">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="btn-touch w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-6 active:bg-white/25"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Chiefs FC"
            width={88}
            height={88}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Hi, Welcome Back!</h1>
          <p className="text-white/70 text-sm mt-1">Sign in to manage Chiefs FC</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-white border border-card-border rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-gray focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/10 transition-all"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white border border-card-border rounded-2xl px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-gray focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/10 transition-all"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-touch absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full bg-maroon-gradient text-white font-semibold rounded-2xl py-4 text-base disabled:opacity-50 shadow-lg shadow-maroon/25 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
