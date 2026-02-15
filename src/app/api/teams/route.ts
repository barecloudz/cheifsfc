import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const existing = await prisma.team.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Team already exists" }, { status: 409 });
  }

  const team = await prisma.team.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(team, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, manualWon, manualDrawn, manualLost, manualGF, manualGA } = body;

  if (!id) {
    return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
  }

  const team = await prisma.team.update({
    where: { id },
    data: {
      manualWon: manualWon ?? 0,
      manualDrawn: manualDrawn ?? 0,
      manualLost: manualLost ?? 0,
      manualGF: manualGF ?? 0,
      manualGA: manualGA ?? 0,
    },
  });

  return NextResponse.json(team);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  // Delete all matches involving this team first
  await prisma.match.deleteMany({
    where: {
      OR: [{ homeTeamId: id }, { awayTeamId: id }],
    },
  });

  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
