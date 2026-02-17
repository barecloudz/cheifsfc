import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: 1 } });
  }
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const {
    teamPhotoUrl, playerCardsOn, cardTypes, pointsPerTraining, upgradeCost,
    showGoalScorers, showHighlights, showPlayerStats, showMotm, showStreaks, showLevels,
    motmPoints, streakBonus3, streakBonus5, streakBonus10,
  } = body;

  const data: Record<string, unknown> = {};
  if (teamPhotoUrl !== undefined) data.teamPhotoUrl = teamPhotoUrl;
  if (playerCardsOn !== undefined) data.playerCardsOn = playerCardsOn;
  if (cardTypes !== undefined) data.cardTypes = cardTypes;
  if (pointsPerTraining !== undefined) data.pointsPerTraining = pointsPerTraining;
  if (upgradeCost !== undefined) data.upgradeCost = upgradeCost;
  if (showGoalScorers !== undefined) data.showGoalScorers = showGoalScorers;
  if (showHighlights !== undefined) data.showHighlights = showHighlights;
  if (showPlayerStats !== undefined) data.showPlayerStats = showPlayerStats;
  if (showMotm !== undefined) data.showMotm = showMotm;
  if (showStreaks !== undefined) data.showStreaks = showStreaks;
  if (showLevels !== undefined) data.showLevels = showLevels;
  if (motmPoints !== undefined) data.motmPoints = motmPoints;
  if (streakBonus3 !== undefined) data.streakBonus3 = streakBonus3;
  if (streakBonus5 !== undefined) data.streakBonus5 = streakBonus5;
  if (streakBonus10 !== undefined) data.streakBonus10 = streakBonus10;

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json(settings);
}
