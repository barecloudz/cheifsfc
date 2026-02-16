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
  const { trainingId, status } = await request.json();

  if (!trainingId || !["in", "out"].includes(status)) {
    return NextResponse.json({ error: "trainingId and status (in/out) required" }, { status: 400 });
  }

  // Check training exists and not completed
  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) {
    return NextResponse.json({ error: "Training not found" }, { status: 404 });
  }
  if (training.completed) {
    return NextResponse.json({ error: "Training already completed" }, { status: 400 });
  }

  const rsvp = await prisma.trainingRsvp.upsert({
    where: { trainingId_playerId: { trainingId, playerId } },
    update: { status },
    create: { trainingId, playerId, status },
  });

  return NextResponse.json(rsvp);
}
