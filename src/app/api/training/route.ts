import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("chiefs_admin")?.value === "authenticated";
}

function getPlayerId(cookieStore: Awaited<ReturnType<typeof cookies>>): number | null {
  const val = cookieStore.get("chiefs_player")?.value;
  return val ? parseInt(val) : null;
}

export async function GET() {
  const cookieStore = await cookies();
  const admin = cookieStore.get("chiefs_admin")?.value === "authenticated";
  const playerId = getPlayerId(cookieStore);

  if (!admin && !playerId) {
    return NextResponse.json([]);
  }

  const trainings = await prisma.training.findMany({
    orderBy: { date: "asc" },
    include: {
      rsvps: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  });

  if (admin) {
    return NextResponse.json(trainings);
  }

  // Player view: include their own RSVP status
  const result = trainings.map((t) => {
    const myRsvp = t.rsvps.find((r) => r.playerId === playerId);
    return {
      ...t,
      myRsvpStatus: myRsvp?.status || "none",
      myAttended: myRsvp?.attended || false,
      rsvpSummary: {
        inCount: t.rsvps.filter((r) => r.status === "in").length,
        outCount: t.rsvps.filter((r) => r.status === "out").length,
      },
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, location, notes } = await request.json();

  if (!date || !location) {
    return NextResponse.json({ error: "Date and location required" }, { status: 400 });
  }

  const training = await prisma.training.create({
    data: { date: new Date(date), location, notes: notes || null },
  });

  return NextResponse.json(training, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, date, location, notes } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Training ID required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (date !== undefined) data.date = new Date(date);
  if (location !== undefined) data.location = location;
  if (notes !== undefined) data.notes = notes || null;

  const training = await prisma.training.update({
    where: { id },
    data,
  });

  return NextResponse.json(training);
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Training ID required" }, { status: 400 });
  }

  await prisma.training.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
