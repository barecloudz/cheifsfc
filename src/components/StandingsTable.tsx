import type { TeamStanding } from "@/lib/standings";

interface StandingsTableProps {
  standings: TeamStanding[];
  limit?: number;
}

export default function StandingsTable({ standings, limit }: StandingsTableProps) {
  const rows = limit ? standings.slice(0, limit) : standings;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray text-[11px] uppercase tracking-wider border-b border-gold/10">
            <th className="text-left py-2.5 px-2 w-8">#</th>
            <th className="text-left py-2.5 px-2">Team</th>
            <th className="text-center py-2.5 px-1">P</th>
            <th className="text-center py-2.5 px-1">W</th>
            <th className="text-center py-2.5 px-1">D</th>
            <th className="text-center py-2.5 px-1">L</th>
            <th className="text-center py-2.5 px-1">GF</th>
            <th className="text-center py-2.5 px-1">GA</th>
            <th className="text-center py-2.5 px-1">GD</th>
            <th className="text-center py-2.5 px-2 text-maroon font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((team, i) => {
            const isChiefs = team.name === "Chiefs FC";
            return (
              <tr
                key={team.id}
                className={`border-b border-card-border transition-colors ${
                  isChiefs
                    ? "bg-maroon/5 border-l-2 border-l-maroon"
                    : "hover:bg-background-secondary"
                }`}
              >
                <td className={`py-2.5 px-2 text-xs ${isChiefs ? "text-maroon font-bold" : "text-gray"}`}>
                  {i + 1}
                </td>
                <td className={`py-2.5 px-2 font-medium text-sm ${isChiefs ? "text-maroon" : ""}`}>
                  {team.name}
                </td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.played}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.won}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.drawn}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.lost}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.goalsFor}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.goalsAgainst}</td>
                <td className="text-center py-2.5 px-1 text-foreground-secondary">{team.goalDifference}</td>
                <td className={`text-center py-2.5 px-2 font-bold ${isChiefs ? "text-maroon" : "text-foreground"}`}>
                  {team.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
