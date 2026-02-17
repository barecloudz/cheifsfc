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
  const showStreaks = settings?.showStreaks ?? true;
  const streakBonus3 = settings?.streakBonus3 ?? 5;
  const streakBonus5 = settings?.streakBonus5 ?? 10;
  const streakBonus10 = settings?.streakBonus10 ?? 25;

  // Mark all RSVPs attended status
  await prisma.trainingRsvp.updateMany({
    where: { trainingId },
    data: { attended: false },
  });

  const streakBonuses: { playerId: number; streak: number; bonus: number }[] = [];

  for (const pid of attendedPlayerIds) {
    await prisma.trainingRsvp.upsert({
      where: { trainingId_playerId: { trainingId, playerId: pid } },
      update: { attended: true },
      create: { trainingId, playerId: pid, status: "in", attended: true },
    });

    // Award training points
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

    // Calculate streak bonus if streaks are enabled
    if (showStreaks) {
      // Get all completed trainings ordered by date desc, including current one
      const completedTrainings = await prisma.training.findMany({
        where: { completed: true },
        orderBy: { date: "desc" },
        include: {
          rsvps: {
            where: { playerId: pid, attended: true },
          },
        },
      });

      // Count consecutive attended (the current training is about to be marked completed)
      // We need to count the streak including this attendance
      let streak = 1; // current attendance counts
      for (const t of completedTrainings) {
        if (t.rsvps.length > 0) {
          streak++;
        } else {
          break;
        }
      }

      // Check if streak matches a bonus threshold
      let bonus = 0;
      if (streak === 10) bonus = streakBonus10;
      else if (streak === 5) bonus = streakBonus5;
      else if (streak === 3) bonus = streakBonus3;

      if (bonus > 0) {
        await prisma.player.update({
          where: { id: pid },
          data: {
            pointBalance: { increment: bonus },
            pointsEarned: { increment: bonus },
          },
        });

        await prisma.pointTransaction.create({
          data: {
            playerId: pid,
            amount: bonus,
            type: "streak_bonus",
            description: `${streak}-training streak bonus!`,
          },
        });

        streakBonuses.push({ playerId: pid, streak, bonus });
      }
    }
  }

  // Mark training as completed
  await prisma.training.update({
    where: { id: trainingId },
    data: { completed: true },
  });

  return NextResponse.json({
    success: true,
    pointsAwarded: pointsPerTraining,
    playersAwarded: attendedPlayerIds.length,
    streakBonuses,
  });
}
