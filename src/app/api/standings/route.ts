import { prisma } from "@/lib/prisma";
import { calculateStandings } from "@/lib/standings";
import { NextResponse } from "next/server";

export async function GET() {
  const standings = await calculateStandings();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return NextResponse.json({ standings, teams });
}
