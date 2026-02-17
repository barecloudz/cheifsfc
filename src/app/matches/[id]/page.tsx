import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = parseInt(id);
  if (isNaN(matchId)) notFound();

  const [match, settings] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        events: { include: { player: true } },
        appearances: { include: { player: true } },
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!match) notFound();

  const played = match.homeScore !== null && match.awayScore !== null;
  const showGoalScorers = settings?.showGoalScorers ?? true;
  const showMotm = settings?.showMotm ?? true;

  // Group goal events by team side
  const goals = match.events.filter((e) => e.type === "goal");
  const assists = match.events.filter((e) => e.type === "assist");
  const motmEvent = match.events.find((e) => e.type === "motm");

  // Determine if a goal scorer is on the home or away side
  // We use appearances to figure out which players played for Chiefs (home or away)
  const isChiefsHome = match.homeTeam.name === "Chiefs FC";

  // Group goals for display
  const goalsByPlayer = new Map<number, { name: string; minutes: number[] }>();
  goals.forEach((g) => {
    if (!g.playerId || !g.player) return;
    const existing = goalsByPlayer.get(g.playerId);
    if (existing) {
      if (g.minute) existing.minutes.push(g.minute);
    } else {
      goalsByPlayer.set(g.playerId, {
        name: g.player.name,
        minutes: g.minute ? [g.minute] : [],
      });
    }
  });

  return (
    <>
      <PageHeader title="Match Details" showBack />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6 md:max-w-5xl">
        <div className="card-premium overflow-hidden">
          <div className="h-1.5 bg-maroon-gradient" />

          <div className="p-6">
            {/* Status badge */}
            <div className="text-center mb-5">
              {match.cancelled ? (
                <span className="inline-block bg-gray-100 text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Cancelled{match.cancelReason ? ` \u2014 ${match.cancelReason}` : ""}
                </span>
              ) : played ? (
                <span className="inline-block bg-maroon/10 text-maroon text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Full Time
                </span>
              ) : (
                <span className="inline-block bg-gold/15 text-gold-dark text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Upcoming
                </span>
              )}
            </div>

            {/* Teams & score */}
            <div className={`flex items-center justify-center gap-5 mb-6 ${match.cancelled ? "opacity-50" : ""}`}>
              <div className="flex-1 text-center">
                <TeamAvatar name={match.homeTeam.name} />
                <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Home</p>
              </div>

              <div className="text-center min-w-[70px]">
                {match.cancelled ? (
                  <div className="text-lg font-bold text-gray-400">CANC</div>
                ) : played ? (
                  <div className="text-4xl font-bold text-foreground">
                    {match.homeScore}
                    <span className="text-gray mx-0.5">-</span>
                    {match.awayScore}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-muted">VS</div>
                )}
              </div>

              <div className="flex-1 text-center">
                <TeamAvatar name={match.awayTeam.name} />
                <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Away</p>
              </div>
            </div>

            {/* Goal scorers */}
            {played && showGoalScorers && goalsByPlayer.size > 0 && (
              <div className="bg-background rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-base">&#9917;</span>
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Goal Scorers</span>
                </div>
                <div className="space-y-1.5">
                  {Array.from(goalsByPlayer.entries()).map(([playerId, { name, minutes }]) => (
                    <div key={playerId} className="flex items-center justify-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      {minutes.length > 0 && (
                        <span className="text-xs text-muted">
                          {minutes.sort((a, b) => a - b).map((m) => `${m}'`).join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assists */}
            {played && showGoalScorers && assists.length > 0 && (
              <div className="bg-background rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Assists</span>
                </div>
                <div className="space-y-1.5">
                  {assists.map((a) => (
                    <div key={a.id} className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-foreground-secondary">{a.player?.name || "Unknown"}</span>
                      {a.minute && <span className="text-xs text-muted">{a.minute}&apos;</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Man of the Match */}
            {played && showMotm && motmEvent?.player && (
              <div className="bg-gold/10 rounded-2xl p-4 mb-4 text-center border border-gold/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-base">&#11088;</span>
                  <span className="text-[11px] font-bold text-gold-dark uppercase tracking-wider">Man of the Match</span>
                </div>
                <p className="text-lg font-bold text-gold-dark">{motmEvent.player.name}</p>
              </div>
            )}

            {/* Date */}
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-foreground-secondary">
                {match.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "America/New_York",
                })}
                {" \u00B7 "}
                {match.date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/New_York",
                })}
              </p>
            </div>

            {/* Venue - prominent */}
            <div className="bg-background rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--maroon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Location</span>
              </div>
              <p className="text-lg font-bold text-foreground mb-3">
                {match.venue}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-touch inline-flex items-center gap-2 bg-maroon text-white text-sm font-semibold px-6 py-2.5 rounded-full active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TeamAvatar({ name }: { name: string }) {
  const isChiefs = name === "Chiefs FC";
  return (
    <>
      {isChiefs ? (
        <Image
          src="/logo.png"
          alt="Chiefs FC"
          width={56}
          height={56}
          className="mx-auto mb-2"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-background-secondary border border-card-border flex items-center justify-center mx-auto mb-2">
          <span className="text-muted text-lg font-bold">
            {name.charAt(0)}
          </span>
        </div>
      )}
      <p className="font-semibold text-sm">{name}</p>
    </>
  );
}
