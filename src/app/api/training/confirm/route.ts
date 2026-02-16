import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("chiefs_admin")?.value === "authenticated";
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trainingId, attendedPlayerIds } = await request.json();

  if (!trainingId || !Array.isArray(attendedPlayerIds)) {
    return NextResponse.json({ error: "trainingId and attendedPlayerIds required" }, { status: 400 });
  }

  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) {
    return NextResponse.json({ error: "Training not found" }, { status: 404 });
  }
  if (training.completed) {
    return NextResponse.json({ error: "Training already confirmed" }, { status: 400 });
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const pointsPerTraining = settings?.pointsPerTraining ?? 10;

  // Mark all RSVPs attended status
  // First, set all to not attended
  await prisma.trainingRsvp.updateMany({
    where: { trainingId },
    data: { attended: false },
  });

  // Create RSVPs for players who attended but didn't RSVP
  for (const pid of attendedPlayerIds) {
    await prisma.trainingRsvp.upsert({
      where: { trainingId_playerId: { trainingId, playerId: pid } },
      update: { attended: true },
      create: { trainingId, playerId: pid, status: "in", attended: true },
    });

    // Award points
    await prisma.player.update({
      where: { id: pid },
      data: {
        pointBalance: { increment: pointsPerTraining },
        pointsEarned: { increment: pointsPerTraining },
      },
    });

    await prisma.pointTransaction.create({
      data: {
        playerId: pid,
        amount: pointsPerTraining,
        type: "training",
        description: `Training attendance: ${training.location}`,
      },
    });
  }

  // Mark training as completed
  await prisma.training.update({
    where: { id: trainingId },
    data: { completed: true },
  });

  return NextResponse.json({ success: true, pointsAwarded: pointsPerTraining, playersAwarded: attendedPlayerIds.length });
}
