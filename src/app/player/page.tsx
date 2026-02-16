"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";

interface PlayerData {
  id: number;
  name: string;
  position: string;
  number: number | null;
  imageUrl: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  cardType: string;
  pointBalance: number;
  pointsEarned: number;
  pointsSpent: number;
  unlockedCardTypes: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface CardTypeInfo {
  value: string;
  label: string;
  imageUrl?: string;
  unlockCost: number;
  unlocked: boolean;
}

interface TrainingSession {
  id: number;
  date: string;
  location: string;
  notes: string | null;
  completed: boolean;
  myRsvpStatus: string;
  myAttended: boolean;
  rsvpSummary: { inCount: number; outCount: number };
}

export default function PlayerDashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upgradeCost, setUpgradeCost] = useState(10);
  const [cardTypes, setCardTypes] = useState<CardTypeInfo[]>([]);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingstat, setUpgradingStat] = useState<string | null>(null);
  const [statFlash, setStatFlash] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);
  const [pointsAnim, setPointsAnim] = useState<{ amount: number; key: number } | null>(null);

  const loadDashboard = useCallback(async () => {
    const res = await fetch("/api/player/dashboard");
    if (!res.ok) {
      router.push("/player/login");
      return;
    }
    const data = await res.json();
    setPlayer(data.player);
    setTransactions(data.transactions);
    setUpgradeCost(data.upgradeCost);
    setCardTypes(data.cardTypes);
    setLoading(false);
  }, [router]);

  const loadTrainings = useCallback(async () => {
    const res = await fetch("/api/training");
    if (res.ok) {
      const data = await res.json();
      setTrainings(data);
    }
  }, []);

  useEffect(() => {
    // Check auth
    fetch("/api/player/login").then((r) => {
      if (!r.ok) router.push("/player/login");
      else { loadDashboard(); loadTrainings(); }
    });
  }, [router, loadDashboard, loadTrainings]);

  async function handleUpgrade(stat: string) {
    if (!player || player.pointBalance < upgradeCost) return;
    setUpgradingStat(stat);

    const res = await fetch("/api/player/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPlayer((prev) => prev ? { ...prev, ...updated } : prev);
      setStatFlash(stat);
      setPointsAnim({ amount: -upgradeCost, key: Date.now() });
      setTimeout(() => setStatFlash(null), 600);

      // Refresh transactions
      const dashRes = await fetch("/api/player/dashboard");
      if (dashRes.ok) {
        const data = await dashRes.json();
        setTransactions(data.transactions);
      }
    }
    setUpgradingStat(null);
  }

  async function handleUnlock(cardType: string) {
    if (!player) return;
    setUnlocking(cardType);

    const res = await fetch("/api/player/unlock-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardType }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPlayer((prev) => prev ? { ...prev, ...updated } : prev);
      setPointsAnim({ amount: -(cardTypes.find((ct) => ct.value === cardType)?.unlockCost || 0), key: Date.now() });
      loadDashboard();
    }
    setUnlocking(null);
  }

  async function handleSwitchCard(cardType: string) {
    if (!player) return;

    const res = await fetch("/api/player/switch-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardType }),
    });

    if (res.ok) {
      setPlayer((prev) => prev ? { ...prev, cardType } : prev);
    }
  }

  async function handleRsvp(trainingId: number, status: "in" | "out") {
    setRsvpLoading(trainingId);
    await fetch("/api/training/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainingId, status }),
    });
    setRsvpLoading(null);
    loadTrainings();
  }

  async function handleLogout() {
    await fetch("/api/player/login", { method: "DELETE" });
    router.push("/player/login");
  }

  if (loading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-maroon border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted">Loading your card...</p>
        </div>
      </div>
    );
  }

  const overall = Math.round((player.pace + player.shooting + player.passing + player.dribbling + player.defending + player.physical) / 6);
  const ratingTier = overall >= 80 ? "elite" : overall >= 70 ? "gold" : overall >= 60 ? "silver" : "bronze";
  const ratingColors = {
    elite: "from-purple-500 to-indigo-600",
    gold: "from-yellow-500 to-amber-600",
    silver: "from-gray-400 to-gray-500",
    bronze: "from-orange-600 to-orange-800",
  };

  const stats = [
    { key: "pace", label: "PAC", value: player.pace },
    { key: "shooting", label: "SHO", value: player.shooting },
    { key: "passing", label: "PAS", value: player.passing },
    { key: "dribbling", label: "DRI", value: player.dribbling },
    { key: "defending", label: "DEF", value: player.defending },
    { key: "physical", label: "PHY", value: player.physical },
  ];

  // Get card image URL for the current card type
  const currentCardType = cardTypes.find((ct) => ct.value === player.cardType);
  const cardImageUrl = currentCardType?.imageUrl;

  const upcomingTrainings = trainings.filter((t) => !t.completed);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-maroon-gradient px-5 pt-4 pb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -mr-10 -mt-10" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-sm font-bold">{player.name}</span>
          </div>
          <button onClick={handleLogout} className="text-[11px] text-white/60 font-medium active:opacity-70">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        {/* Player Card Hero */}
        <div className="flex justify-center mb-4">
          <div className="w-48">
            <PlayerCard
              name={player.name}
              position={player.position}
              number={player.number}
              imageUrl={player.imageUrl}
              pace={player.pace}
              shooting={player.shooting}
              passing={player.passing}
              dribbling={player.dribbling}
              defending={player.defending}
              physical={player.physical}
              cardType={player.cardType}
              cardImageUrl={cardImageUrl}
            />
          </div>
        </div>

        {/* OVR Badge */}
        <div className="flex justify-center mb-5">
          <div className={`bg-gradient-to-r ${ratingColors[ratingTier]} text-white px-5 py-1.5 rounded-full shadow-lg`}>
            <span className="text-lg font-black">{overall}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider ml-1.5 opacity-80">OVR</span>
          </div>
        </div>

        {/* Points Balance */}
        <div className="card-premium overflow-hidden mb-4 relative">
          <div className="h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-black text-gold-dark">{player.pointBalance}</p>
                <p className="text-[10px] text-muted">points available</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted">{player.pointsEarned} earned · {player.pointsSpent} spent</p>
            </div>
          </div>
          {/* Points animation */}
          {pointsAnim && (
            <div key={pointsAnim.key} className="absolute top-2 right-4 animate-pointsFloat pointer-events-none">
              <span className={`text-sm font-bold ${pointsAnim.amount > 0 ? "text-emerald-500" : "text-red-500"}`}>
                {pointsAnim.amount > 0 ? "+" : ""}{pointsAnim.amount}
              </span>
            </div>
          )}
        </div>

        {/* Stat Upgrades */}
        <div className="card-premium overflow-hidden mb-4">
          <div className="h-1 bg-maroon-gradient" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Upgrade Stats</h3>
              <span className="text-[10px] text-muted font-medium">{upgradeCost} pts per upgrade</span>
            </div>
            <div className="space-y-2">
              {stats.map((s) => (
                <div
                  key={s.key}
                  className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors ${statFlash === s.key ? "animate-statPulse" : ""}`}
                >
                  <span className="text-[10px] font-bold text-muted w-7 shrink-0 uppercase">{s.label}</span>
                  <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-maroon to-maroon-light rounded-full transition-all duration-500"
                      style={{ width: `${(s.value / 99) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground w-7 text-right">{s.value}</span>
                  <button
                    onClick={() => handleUpgrade(s.key)}
                    disabled={player.pointBalance < upgradeCost || s.value >= 99 || upgradingstat === s.key}
                    className="btn-touch w-8 h-8 rounded-lg bg-maroon/10 text-maroon font-bold text-sm flex items-center justify-center active:scale-90 disabled:opacity-30 disabled:active:scale-100"
                  >
                    {upgradingstat === s.key ? (
                      <div className="w-3 h-3 border border-maroon border-t-transparent rounded-full animate-spin" />
                    ) : "+"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card Collection */}
        {cardTypes.length > 1 && (
          <div className="card-premium overflow-hidden mb-4">
            <div className="h-1 bg-gold/40" />
            <div className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Card Collection</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {cardTypes.map((ct) => {
                  const isEquipped = player.cardType === ct.value;
                  const isLocked = !ct.unlocked;
                  return (
                    <button
                      key={ct.value}
                      onClick={() => {
                        if (isEquipped) return;
                        if (isLocked) {
                          if (confirm(`Unlock ${ct.label} card for ${ct.unlockCost} points?`)) {
                            handleUnlock(ct.value);
                          }
                        } else {
                          handleSwitchCard(ct.value);
                        }
                      }}
                      disabled={isEquipped || unlocking === ct.value}
                      className={`shrink-0 w-20 rounded-xl p-2 text-center transition-all relative ${
                        isEquipped
                          ? "bg-maroon/10 ring-2 ring-maroon shadow-sm animate-cardGlow"
                          : isLocked
                          ? "bg-background-secondary opacity-60"
                          : "bg-background-secondary hover:bg-white active:scale-95"
                      }`}
                    >
                      {ct.imageUrl ? (
                        <div className={`w-12 h-16 mx-auto relative mb-1 ${isLocked ? "grayscale blur-[1px]" : ""}`}>
                          <img src={ct.imageUrl} alt={ct.label} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-16 mx-auto bg-card-border/30 rounded mb-1 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                          </svg>
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-foreground truncate">{ct.label}</p>
                      {isEquipped && (
                        <span className="text-[8px] font-bold text-maroon uppercase">Equipped</span>
                      )}
                      {isLocked && ct.unlockCost > 0 && (
                        <span className="text-[8px] font-bold text-gold-dark">{ct.unlockCost} pts</span>
                      )}
                      {!isEquipped && !isLocked && ct.value !== "default" && (
                        <span className="text-[8px] font-bold text-emerald-600 uppercase">Tap to use</span>
                      )}
                      {unlocking === ct.value && (
                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Training */}
        {upcomingTrainings.length > 0 && (
          <div className="card-premium overflow-hidden mb-4">
            <div className="h-1 bg-gold/40" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Upcoming Training</h3>
              </div>
              <div className="space-y-3">
                {upcomingTrainings.map((t) => {
                  const trainingDate = new Date(t.date);
                  const now = new Date();
                  const diffMs = trainingDate.getTime() - now.getTime();
                  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                  const diffHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

                  return (
                    <div key={t.id} className="bg-background rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.location}</p>
                          <p className="text-[11px] text-muted">
                            {trainingDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" })}
                            {" · "}
                            {trainingDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-gold-dark bg-gold/10 px-2 py-0.5 rounded-full">
                          {diffDays > 0 ? `${diffDays}d` : diffHours > 0 ? `${diffHours}h` : "Today"}
                        </span>
                      </div>
                      {t.notes && <p className="text-[11px] text-muted italic mb-2">{t.notes}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRsvp(t.id, "in")}
                          disabled={rsvpLoading === t.id}
                          className={`btn-touch flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] ${
                            t.myRsvpStatus === "in"
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {t.myRsvpStatus === "in" ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              I&apos;m In
                            </span>
                          ) : "I'm In"}
                        </button>
                        <button
                          onClick={() => handleRsvp(t.id, "out")}
                          disabled={rsvpLoading === t.id}
                          className={`btn-touch w-20 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                            t.myRsvpStatus === "out"
                              ? "bg-red-500 text-white"
                              : "bg-red-50 text-red-500 hover:bg-red-100"
                          }`}
                        >
                          Out
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-card-border">
                        <span className="text-[10px] text-emerald-600 font-medium">{t.rsvpSummary.inCount} in</span>
                        <span className="text-[10px] text-red-500 font-medium">{t.rsvpSummary.outCount} out</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Completed Training with attendance results */}
        {trainings.filter((t) => t.completed).length > 0 && (
          <div className="card-premium overflow-hidden mb-4">
            <div className="h-1 bg-background-secondary" />
            <div className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Past Training</h3>
              <div className="space-y-1.5">
                {trainings.filter((t) => t.completed).slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.location}</p>
                      <p className="text-[10px] text-muted">
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}
                      </p>
                    </div>
                    {t.myAttended ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Attended +{upgradeCost} pts
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted bg-background-secondary px-2 py-0.5 rounded-full">
                        Missed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {transactions.length > 0 && (
          <div className="card-premium overflow-hidden mb-4">
            <div className="h-1 bg-background-secondary" />
            <div className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-0">
                {transactions.slice(0, 10).map((tx) => {
                  const icon = tx.type === "training" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ) : tx.type === "upgrade" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    </svg>
                  ) : tx.type === "card_unlock" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  );

                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(tx.createdAt).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins}m ago`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h ago`;
                    const days = Math.floor(hrs / 24);
                    return `${days}d ago`;
                  })();

                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-card-border last:border-0">
                      <div className="w-7 h-7 rounded-lg bg-background-secondary flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted">{timeAgo}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
