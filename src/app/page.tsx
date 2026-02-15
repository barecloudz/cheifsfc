import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings";
import MatchCard from "@/components/MatchCard";
import StandingsTable from "@/components/StandingsTable";
import CountdownTimer from "@/components/CountdownTimer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();

  const nextMatch = await prisma.match.findFirst({
    where: {
      date: { gte: now },
      homeScore: null,
    },
    orderBy: { date: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  const recentMatches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
    orderBy: { date: "desc" },
    take: 3,
    include: { homeTeam: true, awayTeam: true },
  });

  const standings = await calculateStandings();

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-[220px] md:h-[280px] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Stadium"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <Image
            src="/logo.png"
            alt="Chiefs FC"
            width={90}
            height={90}
            className="mb-2 drop-shadow-xl"
          />
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Chiefs FC</h1>
          <p className="text-white/70 text-[11px] mt-0.5 tracking-widest uppercase">
            Division 3 &middot; Asheville, NC
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-6 md:max-w-5xl animate-fadeInUp">

      {/* Next Match */}
      {nextMatch && (
        <section className="mb-6">
          <SectionHeader title="Next Match" />
          <div className="card-premium overflow-hidden">
            <div className="h-1.5 bg-maroon-gradient" />
            <div className="p-5">
              {/* Teams */}
              <div className="flex items-center justify-between mb-5">
                <TeamAvatar name={nextMatch.homeTeam.name} />
                <div className="px-3">
                  <span className="text-base font-bold text-muted">VS</span>
                </div>
                <TeamAvatar name={nextMatch.awayTeam.name} />
              </div>

              {/* Countdown */}
              <div className="flex justify-center mb-5">
                <CountdownTimer targetDate={nextMatch.date.toISOString()} />
              </div>

              {/* Date & address */}
              <div className="text-center text-sm font-medium text-foreground-secondary mb-4 space-y-0.5">
                <p>
                  {nextMatch.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    timeZone: "America/New_York",
                  })}
                  {" \u00B7 "}
                  {nextMatch.date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/New_York",
                  })}
                </p>
                {nextMatch.venue && (
                  <p>{nextMatch.venue.includes(",") ? nextMatch.venue.substring(nextMatch.venue.indexOf(",") + 1).trim() : nextMatch.venue}</p>
                )}
              </div>

              {/* Field # - big and bold */}
              {nextMatch.venue && (
                <div className="bg-background rounded-2xl p-4 text-center">
                  <p className="text-xl font-bold text-foreground mb-3">
                    {nextMatch.venue.includes(",") ? nextMatch.venue.substring(0, nextMatch.venue.indexOf(",")) : nextMatch.venue}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextMatch.venue)}`}
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Recent Results" href="/schedule" />
          <div className="space-y-3">
            {recentMatches.map((m) => (
              <MatchCard
                key={m.id}
                id={m.id}
                date={m.date.toISOString()}
                venue={m.venue}
                homeTeam={m.homeTeam.name}
                awayTeam={m.awayTeam.name}
                homeScore={m.homeScore}
                awayScore={m.awayScore}
              />
            ))}
          </div>
        </section>
      )}

      {/* League Table */}
      <section className="mb-6">
        <SectionHeader title="League Table" href="/table" />
        <div className="card-premium p-4">
          <StandingsTable standings={standings} limit={5} />
        </div>
      </section>
      </div>
    </div>
  );
}

function TeamAvatar({ name }: { name: string }) {
  const isChiefs = name === "Chiefs FC";
  return (
    <div className="flex-1 text-center">
      {isChiefs ? (
        <Image
          src="/logo.png"
          alt="Chiefs FC"
          width={52}
          height={52}
          className="mx-auto mb-2"
        />
      ) : (
        <div className="w-[52px] h-[52px] rounded-full bg-background-secondary border border-card-border flex items-center justify-center mx-auto mb-2">
          <span className="text-muted text-base font-bold">
            {name.charAt(0)}
          </span>
        </div>
      )}
      <p className="font-semibold text-sm leading-tight">{name}</p>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {href && (
        <Link
          href={href}
          className="btn-touch text-xs text-maroon font-semibold px-2 active:opacity-70"
        >
          See all
        </Link>
      )}
    </div>
  );
}
