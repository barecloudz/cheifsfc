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
      include: {
        homeTeam: true,
        awayTeam: true,
        events: { include: { player: true } },
        appearances: { include: { player: true } },
      },
    });
  } else if (filter === "all") {
    matches = await prisma.match.findMany({
      orderBy: { date: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        events: { include: { player: true } },
        appearances: { include: { player: true } },
      },
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
      include: {
        homeTeam: true,
        awayTeam: true,
        events: { include: { player: true } },
        appearances: { include: { player: true } },
      },
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
  const { id, homeScore, awayScore, date, venue, homeTeamId, awayTeamId, cancelled, cancelReason, events, appearances } = body;

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

  // Save match events if provided
  if (events !== undefined) {
    // Delete existing events for this match
    await prisma.matchEvent.deleteMany({ where: { matchId: id } });

    if (events.length > 0) {
      await prisma.matchEvent.createMany({
        data: events.map((e: { playerId?: number; type: string; minute?: number; notes?: string }) => ({
          matchId: id,
          playerId: e.playerId || null,
          type: e.type,
          minute: e.minute || null,
          notes: e.notes || null,
        })),
      });
    }

    // If there's a MOTM event, award points
    const motmEvent = events.find((e: { type: string }) => e.type === "motm");
    if (motmEvent?.playerId) {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
      const motmPoints = settings?.motmPoints ?? 15;

      // Check if we already awarded MOTM points for this match
      const existingMotmTx = await prisma.pointTransaction.findFirst({
        where: {
          playerId: motmEvent.playerId,
          type: "motm",
          description: { contains: `Match #${id}` },
        },
      });

      if (!existingMotmTx && motmPoints > 0) {
        await prisma.player.update({
          where: { id: motmEvent.playerId },
          data: {
            pointBalance: { increment: motmPoints },
            pointsEarned: { increment: motmPoints },
          },
        });
        await prisma.pointTransaction.create({
          data: {
            playerId: motmEvent.playerId,
            amount: motmPoints,
            type: "motm",
            description: `Man of the Match — Match #${id}`,
          },
        });
      }
    }
  }

  // Save appearances if provided
  if (appearances !== undefined) {
    await prisma.matchAppearance.deleteMany({ where: { matchId: id } });

    if (appearances.length > 0) {
      await prisma.matchAppearance.createMany({
        data: appearances.map((playerId: number) => ({
          matchId: id,
          playerId,
        })),
      });
    }
  }

  // Return updated match with relations
  const updated = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      events: { include: { player: true } },
      appearances: { include: { player: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  await prisma.match.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
