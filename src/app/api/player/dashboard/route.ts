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

  const [player, transactions, settings, motmEvents, trainings] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.pointTransaction.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.matchEvent.findMany({
      where: { playerId, type: "motm" },
    }),
    prisma.training.findMany({
      where: { completed: true },
      orderBy: { date: "desc" },
      include: {
        rsvps: {
          where: { playerId },
        },
      },
    }),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Compute training streak (consecutive attended trainings, most recent first)
  let streak = 0;
  for (const t of trainings) {
    const rsvp = t.rsvps[0];
    if (rsvp?.attended) {
      streak++;
    } else {
      break;
    }
  }

  // Compute XP level
  const xpThresholds = [
    { min: 500, label: "Legend" },
    { min: 300, label: "Veteran" },
    { min: 150, label: "Regular" },
    { min: 50, label: "Starter" },
    { min: 0, label: "Rookie" },
  ];
  const level = xpThresholds.find((t) => player.pointsEarned >= t.min)?.label || "Rookie";

  const cardTypes: { value: string; label: string; imageUrl?: string; unlockCost?: number; unlockable?: boolean }[] = (() => {
    try { return JSON.parse(settings?.cardTypes || "[]"); } catch { return []; }
  })();

  const unlockedCardTypes: string[] = (() => {
    try { return JSON.parse(player.unlockedCardTypes); } catch { return []; }
  })();

  const cardTypesWithStatus = [
    { value: "default", label: "Default", unlockCost: 0, unlockable: true, unlocked: true },
    ...cardTypes.filter((ct) => ct.unlockable !== false).map((ct) => ({
      ...ct,
      unlockCost: ct.unlockCost || 0,
      unlockable: ct.unlockable !== false,
      unlocked: unlockedCardTypes.includes(ct.value),
    })),
  ];

  return NextResponse.json({
    player,
    transactions,
    upgradeCost: settings?.upgradeCost ?? 10,
    cardTypes: cardTypesWithStatus,
    motmCount: motmEvents.length,
    streak,
    level,
    settings: {
      showMotm: settings?.showMotm ?? true,
      showStreaks: settings?.showStreaks ?? true,
      showLevels: settings?.showLevels ?? true,
      pointsPerTraining: settings?.pointsPerTraining ?? 10,
    },
  });
}
