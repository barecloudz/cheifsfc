import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("chiefs_admin")?.value === "authenticated";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      pointBalance: true,
      pointsEarned: true,
      pointsSpent: true,
      pointTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerIds, amount, description } = await request.json();

  if (!playerIds?.length || !amount || !description) {
    return NextResponse.json({ error: "playerIds, amount, and description required" }, { status: 400 });
  }

  for (const pid of playerIds) {
    await prisma.player.update({
      where: { id: pid },
      data: {
        pointBalance: { increment: amount },
        pointsEarned: { increment: amount > 0 ? amount : 0 },
      },
    });

    await prisma.pointTransaction.create({
      data: {
        playerId: pid,
        amount,
        type: "award",
        description,
      },
    });
  }

  return NextResponse.json({ success: true });
}
