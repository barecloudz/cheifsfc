"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";

interface MatchData {
  id: number;
  date: string;
  venue: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  homeScore: number | null;
  awayScore: number | null;
  cancelled: boolean;
  cancelReason: string | null;
}

type Filter = "upcoming" | "past";

export default function SchedulePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      });
  }, [filter]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6 md:max-w-5xl animate-fadeInUp">
      {/* Filter tabs - pill style, full width */}
      <div className="flex gap-2 mb-5 bg-background-secondary rounded-2xl p-1">
        {(["upcoming", "past"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-touch flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? "bg-white text-maroon shadow-sm"
                : "text-muted"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-[140px] animate-pulse border border-card-border" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-muted text-sm font-medium">No {filter} matches</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              id={m.id}
              date={m.date}
              venue={m.venue}
              homeTeam={m.homeTeam.name}
              awayTeam={m.awayTeam.name}
              homeScore={m.homeScore}
              awayScore={m.awayScore}
              cancelled={m.cancelled}
              cancelReason={m.cancelReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
