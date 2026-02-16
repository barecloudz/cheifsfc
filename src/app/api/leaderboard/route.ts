import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      position: true,
      number: true,
      imageUrl: true,
      pace: true,
      shooting: true,
      passing: true,
      dribbling: true,
      defending: true,
      physical: true,
      cardType: true,
    },
    orderBy: { name: "asc" },
  });

  const ranked = players
    .map((p) => ({
      ...p,
      overall: Math.round((p.pace + p.shooting + p.passing + p.dribbling + p.defending + p.physical) / 6),
    }))
    .sort((a, b) => b.overall - a.overall);

  return NextResponse.json(ranked);
}
