import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter") || "upcoming";
  const now = new Date();

  let matches;
  if (filter === "past") {
    matches = await prisma.match.findMany({
      where: {
        homeScore: { not: null },
        awayScore: { not: null },
      },
      orderBy: { date: "desc" },
      include: { homeTeam: true, awayTeam: true },
    });
  } else if (filter === "all") {
    matches = await prisma.match.findMany({
      orderBy: { date: "asc" },
      include: { homeTeam: true, awayTeam: true },
    });
  } else {
    matches = await prisma.match.findMany({
      where: {
        OR: [
          { date: { gte: now } },
          { homeScore: null },
        ],
      },
      orderBy: { date: "asc" },
      include: { homeTeam: true, awayTeam: true },
    });
  }

  return NextResponse.json(matches);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, venue, homeTeamId, awayTeamId, homeScore, awayScore } = body;

  const match = await prisma.match.create({
    data: {
      date: new Date(date),
      venue,
      homeTeamId,
      awayTeamId,
      ...(homeScore !== undefined && awayScore !== undefined
        ? { homeScore, awayScore }
        : {}),
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json(match, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, homeScore, awayScore, date, venue, homeTeamId, awayTeamId, cancelled, cancelReason } = body;

  const data: Record<string, unknown> = {};
  if (homeScore !== undefined) data.homeScore = homeScore;
  if (awayScore !== undefined) data.awayScore = awayScore;
  if (date !== undefined) data.date = new Date(date);
  if (venue !== undefined) data.venue = venue;
  if (homeTeamId !== undefined) data.homeTeamId = homeTeamId;
  if (awayTeamId !== undefined) data.awayTeamId = awayTeamId;
  if (cancelled !== undefined) data.cancelled = cancelled;
  if (cancelReason !== undefined) data.cancelReason = cancelReason;

  const match = await prisma.match.update({
    where: { id },
    data,
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json(match);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  await prisma.match.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
