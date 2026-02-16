import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("chiefs_player");

  if (!session?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = parseInt(session.value);

  const [player, transactions, settings] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.pointTransaction.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const cardTypes: { value: string; label: string; imageUrl?: string; unlockCost?: number }[] = (() => {
    try { return JSON.parse(settings?.cardTypes || "[]"); } catch { return []; }
  })();

  const unlockedCardTypes: string[] = (() => {
    try { return JSON.parse(player.unlockedCardTypes); } catch { return []; }
  })();

  const cardTypesWithStatus = [
    { value: "default", label: "Default", unlockCost: 0, unlocked: true },
    ...cardTypes.map((ct) => ({
      ...ct,
      unlockCost: ct.unlockCost || 0,
      unlocked: unlockedCardTypes.includes(ct.value),
    })),
  ];

  return NextResponse.json({
    player,
    transactions,
    upgradeCost: settings?.upgradeCost ?? 10,
    cardTypes: cardTypesWithStatus,
  });
}
