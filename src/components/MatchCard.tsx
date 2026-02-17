"use client";

import Link from "next/link";
import Image from "next/image";

interface GoalScorer {
  name: string;
  count: number;
}

interface MatchCardProps {
  id: number;
  date: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  cancelled?: boolean;
  cancelReason?: string | null;
  goalScorers?: GoalScorer[];
  showGoalScorers?: boolean;
}

export default function MatchCard({
  id,
  date,
  venue,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  cancelled,
  cancelReason,
  goalScorers,
  showGoalScorers = true,
}: MatchCardProps) {
  const matchDate = new Date(date);
  const played = homeScore !== null && awayScore !== null;

  // Determine if Chiefs won, lost, or drew
  const isChiefsHome = homeTeam === "Chiefs FC";
  const isChiefsAway = awayTeam === "Chiefs FC";
  let resultIndicator: "W" | "L" | "D" | null = null;
  if (played && (isChiefsHome || isChiefsAway)) {
    const chiefsScore = isChiefsHome ? homeScore! : awayScore!;
    const opponentScore = isChiefsHome ? awayScore! : homeScore!;
    if (chiefsScore > opponentScore) resultIndicator = "W";
    else if (chiefsScore < opponentScore) resultIndicator = "L";
    else resultIndicator = "D";
  }

  const resultColors = {
    W: "bg-green-600/10 text-green-700 border-green-600/20",
    L: "bg-red-600/10 text-red-700 border-red-600/20",
    D: "bg-yellow-600/10 text-yellow-700 border-yellow-600/20",
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-card-border hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all active:scale-[0.99]">
      <Link href={`/matches/${id}`} className="block">
        {/* Date & result */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted font-medium">
            {matchDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "America/New_York",
            })}
            {" \u00B7 "}
            {matchDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/New_York",
            })}
          </span>
          {cancelled ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
              CANCELLED
            </span>
          ) : resultIndicator && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${resultColors[resultIndicator]}`}
            >
              {resultIndicator}
            </span>
          )}
        </div>

        {/* Teams & score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 flex items-center gap-2.5">
            <TeamBadge name={homeTeam} side="home" />
            <p className="font-semibold text-sm text-foreground">{homeTeam}</p>
          </div>
          <div className="px-3 text-center min-w-[60px]">
            {cancelled ? (
              <span className="text-xs text-gray-400 font-medium">{cancelReason || "Cancelled"}</span>
            ) : played ? (
              <span className="text-xl font-bold text-maroon">
                {homeScore} - {awayScore}
              </span>
            ) : (
              <span className="text-sm text-maroon font-semibold">VS</span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2.5 justify-end">
            <p className="font-semibold text-sm text-foreground text-right">{awayTeam}</p>
            <TeamBadge name={awayTeam} side="away" />
          </div>
        </div>

        {/* Goal scorers */}
        {played && showGoalScorers && goalScorers && goalScorers.length > 0 && (
          <div className="mb-3 text-center">
            <p className="text-[11px] text-muted">
              {goalScorers.map((g, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  {g.name}{g.count > 1 ? ` (${g.count})` : ""}
                </span>
              ))}
            </p>
          </div>
        )}
      </Link>

      {/* Venue & directions */}
      <div className="flex items-center justify-between pt-3 border-t border-card-border">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-xs font-medium text-foreground-secondary truncate">{venue}</span>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 ml-3 inline-flex items-center gap-1 bg-maroon text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-maroon-light transition-colors active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Directions
        </a>
      </div>
    </div>
  );
}

function TeamBadge({ name, side }: { name: string; side: "home" | "away" }) {
  if (name === "Chiefs FC") {
    return (
      <Image
        src="/logo.png"
        alt="Chiefs FC"
        width={36}
        height={36}
        className="shrink-0 rounded-full"
      />
    );
  }
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
      side === "home"
        ? "bg-gold/10 border border-gold/20"
        : "bg-background-secondary border border-card-border"
    }`}>
      <span className={`text-[11px] font-bold ${side === "home" ? "text-gold-dark" : "text-muted"}`}>
        {name.charAt(0)}
      </span>
    </div>
  );
}
