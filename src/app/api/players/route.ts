import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, position, number, imageUrl, pace, shooting, passing, dribbling, defending, physical } = body;

  if (!name || !position) {
    return NextResponse.json({ error: "Name and position are required" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      name,
      position,
      number: number || null,
      imageUrl: imageUrl || null,
      pace: pace ?? 50,
      shooting: shooting ?? 50,
      passing: passing ?? 50,
      dribbling: dribbling ?? 50,
      defending: defending ?? 50,
      physical: physical ?? 50,
    },
  });

  return NextResponse.json(player, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id },
    data,
  });

  return NextResponse.json(player);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
  }

  await prisma.player.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
