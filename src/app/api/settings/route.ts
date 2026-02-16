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
  const { teamPhotoUrl, playerCardsOn, cardTypes } = body;

  const data: Record<string, unknown> = {};
  if (teamPhotoUrl !== undefined) data.teamPhotoUrl = teamPhotoUrl;
  if (playerCardsOn !== undefined) data.playerCardsOn = playerCardsOn;
  if (cardTypes !== undefined) data.cardTypes = cardTypes;

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json(settings);
}
