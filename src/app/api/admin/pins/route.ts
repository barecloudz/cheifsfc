import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("chiefs_admin")?.value === "authenticated";
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerId, pin } = await request.json();

  if (!playerId) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 });
  }

  if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: playerId },
    data: { pin: pin || null },
  });

  return NextResponse.json(player);
}
