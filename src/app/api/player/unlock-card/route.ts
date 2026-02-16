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

  const [player, settings] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const cardTypes: { value: string; label: string; unlockCost?: number }[] = (() => {
    try { return JSON.parse(settings?.cardTypes || "[]"); } catch { return []; }
  })();

  const targetType = cardTypes.find((ct) => ct.value === cardType);
  if (!targetType) {
    return NextResponse.json({ error: "Card type not found" }, { status: 404 });
  }

  const unlockCost = targetType.unlockCost || 0;

  const unlockedCardTypes: string[] = (() => {
    try { return JSON.parse(player.unlockedCardTypes); } catch { return []; }
  })();

  if (unlockedCardTypes.includes(cardType)) {
    return NextResponse.json({ error: "Already unlocked" }, { status: 400 });
  }

  if (player.pointBalance < unlockCost) {
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
  }

  const newUnlocked = [...unlockedCardTypes, cardType];

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      unlockedCardTypes: JSON.stringify(newUnlocked),
      cardType: cardType,
      pointBalance: player.pointBalance - unlockCost,
      pointsSpent: player.pointsSpent + unlockCost,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      playerId,
      amount: -unlockCost,
      type: "card_unlock",
      description: `Unlocked ${targetType.label} card`,
    },
  });

  return NextResponse.json(updated);
}
