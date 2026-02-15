import { prisma } from "./prisma";

export interface TeamStanding {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export async function calculateStandings(): Promise<TeamStanding[]> {
  const teams = await prisma.team.findMany();
  const matches = await prisma.match.findMany({
    where: {
      homeScore: { not: null },
      awayScore: { not: null },
    },
  });

  const standings: Map<number, TeamStanding> = new Map();

  for (const team of teams) {
    standings.set(team.id, {
      id: team.id,
      name: team.name,
      played: team.manualWon + team.manualDrawn + team.manualLost,
      won: team.manualWon,
      drawn: team.manualDrawn,
      lost: team.manualLost,
      goalsFor: team.manualGF,
      goalsAgainst: team.manualGA,
      goalDifference: 0,
      points: (team.manualWon * 3) + team.manualDrawn,
    });
  }

  for (const match of matches) {
    const homeScore = match.homeScore!;
    const awayScore = match.awayScore!;
    const home = standings.get(match.homeTeamId)!;
    const away = standings.get(match.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (homeScore < awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const result = Array.from(standings.values());
  for (const team of result) {
    team.goalDifference = team.goalsFor - team.goalsAgainst;
  }

  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  return result;
}
