import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const highlights = await prisma.highlight.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { match: { include: { homeTeam: true, awayTeam: true } } },
  });
  return NextResponse.json(highlights);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, videoUrl, thumbnail, matchId, pinned } = body;

  if (!title || !videoUrl) {
    return NextResponse.json({ error: "Title and videoUrl required" }, { status: 400 });
  }

  const highlight = await prisma.highlight.create({
    data: {
      title,
      videoUrl,
      thumbnail: thumbnail || null,
      matchId: matchId || null,
      pinned: pinned || false,
    },
  });

  return NextResponse.json(highlight, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
