"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PlayerOption {
  id: number;
  name: string;
}

export default function PlayerLoginPage() {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => setPlayers(data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer || pin.length !== 4) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/player/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: parseInt(selectedPlayer), pin }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/player");
    } else {
      setError("Invalid PIN. Ask your admin for help.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Maroon hero header */}
      <div className="bg-maroon-gradient px-5 pt-4 pb-10 text-white rounded-b-[32px] relative">
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
          <h1 className="text-2xl font-bold">Player Login</h1>
          <p className="text-white/70 text-sm mt-1">View your card & earn rewards</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Your Name
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-white border border-card-border rounded-2xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/10 transition-all"
              required
            >
              <option value="">Choose player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              4-Digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Enter your PIN"
              className="w-full bg-white border border-card-border rounded-2xl px-4 py-3.5 text-sm text-foreground text-center tracking-[0.5em] font-bold placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/10 transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !selectedPlayer || pin.length !== 4}
            className="btn-touch w-full bg-maroon-gradient text-white font-semibold rounded-2xl py-4 text-base disabled:opacity-50 shadow-lg shadow-maroon/25 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/admin/login" className="text-xs text-muted hover:text-foreground transition-colors">
            Admin login &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
