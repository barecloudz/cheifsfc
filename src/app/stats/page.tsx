import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!(settings?.showPlayerStats ?? true)) {
    redirect("/");
  }

  const players = await prisma.player.findMany({
    include: {
      appearances: true,
      matchEvents: true,
    },
    orderBy: { name: "asc" },
  });

  const stats = players.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    number: p.number,
    appearances: p.appearances.length,
    goals: p.matchEvents.filter((e) => e.type === "goal").length,
    assists: p.matchEvents.filter((e) => e.type === "assist").length,
    yellowCards: p.matchEvents.filter((e) => e.type === "yellow_card").length,
    redCards: p.matchEvents.filter((e) => e.type === "red_card").length,
    motm: p.matchEvents.filter((e) => e.type === "motm").length,
  }));

  stats.sort((a, b) => b.goals - a.goals || b.appearances - a.appearances);

  return (
    <>
      <PageHeader title="Player Stats" showBack />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24 md:max-w-5xl animate-fadeInUp">
        <div className="card-premium overflow-hidden">
          <div className="h-1.5 bg-maroon-gradient" />
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray text-[10px] uppercase tracking-wider border-b border-gold/10">
                    <th className="text-left py-2.5 px-2">Player</th>
                    <th className="text-center py-2.5 px-1">Apps</th>
                    <th className="text-center py-2.5 px-1">G</th>
                    <th className="text-center py-2.5 px-1">A</th>
                    <th className="text-center py-2.5 px-1">
                      <span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm" title="Yellow Cards" />
                    </th>
                    <th className="text-center py-2.5 px-1">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-sm" title="Red Cards" />
                    </th>
                    <th className="text-center py-2.5 px-1 hidden sm:table-cell">
                      <span title="Man of the Match">&#11088;</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((p) => (
                    <tr key={p.id} className="border-b border-card-border hover:bg-background-secondary transition-colors">
                      <td className="py-2.5 px-2">
                        <div>
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted ml-1.5">{p.position}</span>
                        </div>
                      </td>
                      <td className="text-center py-2.5 px-1 text-foreground-secondary font-medium">{p.appearances}</td>
                      <td className="text-center py-2.5 px-1 text-foreground font-bold">{p.goals || "-"}</td>
                      <td className="text-center py-2.5 px-1 text-foreground-secondary">{p.assists || "-"}</td>
                      <td className="text-center py-2.5 px-1 text-yellow-600 font-medium">{p.yellowCards || "-"}</td>
                      <td className="text-center py-2.5 px-1 text-red-500 font-medium">{p.redCards || "-"}</td>
                      <td className="text-center py-2.5 px-1 text-gold-dark font-medium hidden sm:table-cell">{p.motm || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.length === 0 && (
              <p className="text-center text-muted text-sm py-8">No player stats recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
