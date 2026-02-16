import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "chiefs_player";

export async function POST(request: NextRequest) {
  const { playerId, pin } = await request.json();

  if (!playerId || !pin) {
    return NextResponse.json({ error: "Player and PIN required" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });

  if (!player || !player.pin || player.pin !== pin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, playerId: player.id });
  response.cookies.set(COOKIE_NAME, String(player.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (session?.value) {
    const playerId = parseInt(session.value);
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (player) {
      return NextResponse.json({ authenticated: true, playerId });
    }
  }

  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
