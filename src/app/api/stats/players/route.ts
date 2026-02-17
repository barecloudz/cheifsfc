import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
    imageUrl: p.imageUrl,
    appearances: p.appearances.length,
    goals: p.matchEvents.filter((e) => e.type === "goal").length,
    assists: p.matchEvents.filter((e) => e.type === "assist").length,
    yellowCards: p.matchEvents.filter((e) => e.type === "yellow_card").length,
    redCards: p.matchEvents.filter((e) => e.type === "red_card").length,
    motm: p.matchEvents.filter((e) => e.type === "motm").length,
  }));

  // Sort by goals desc, then appearances desc
  stats.sort((a, b) => b.goals - a.goals || b.appearances - a.appearances);

  return NextResponse.json(stats);
}
