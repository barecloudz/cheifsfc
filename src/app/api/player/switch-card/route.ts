import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("chiefs_player");

  if (!session?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = parseInt(session.value);
  const { cardType } = await request.json();

  if (!cardType) {
    return NextResponse.json({ error: "Card type required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Default is always available
  if (cardType !== "default") {
    const unlockedCardTypes: string[] = (() => {
      try { return JSON.parse(player.unlockedCardTypes); } catch { return []; }
    })();

    if (!unlockedCardTypes.includes(cardType)) {
      return NextResponse.json({ error: "Card type not unlocked" }, { status: 400 });
    }
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: { cardType },
  });

  return NextResponse.json(updated);
}
