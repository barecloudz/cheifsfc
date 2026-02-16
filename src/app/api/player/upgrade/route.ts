import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STAT_MAX, STAT_FIELDS, StatField } from "@/lib/points";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("chiefs_player");

  if (!session?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playerId = parseInt(session.value);
  const { stat } = await request.json();

  if (!STAT_FIELDS.includes(stat as StatField)) {
    return NextResponse.json({ error: "Invalid stat" }, { status: 400 });
  }

  const [player, settings] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const upgradeCost = settings?.upgradeCost ?? 10;
  const currentValue = player[stat as StatField] as number;

  if (currentValue >= STAT_MAX) {
    return NextResponse.json({ error: "Stat already at maximum" }, { status: 400 });
  }

  if (player.pointBalance < upgradeCost) {
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      [stat]: currentValue + 1,
      pointBalance: player.pointBalance - upgradeCost,
      pointsSpent: player.pointsSpent + upgradeCost,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      playerId,
      amount: -upgradeCost,
      type: "upgrade",
      description: `Upgraded ${stat.toUpperCase()} to ${currentValue + 1}`,
    },
  });

  return NextResponse.json(updated);
}
