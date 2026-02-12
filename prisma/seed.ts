import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const teams = [
    { name: "Chiefs FC" },
    { name: "AVL FC" },
    { name: "Asheville Wednesday FC" },
    { name: "Barleys FC" },
    { name: "06 Chivas" },
    { name: "Perros FC" },
    { name: "Real Azteca" },
    { name: "Rocky's FC" },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: {},
      create: team,
    });
  }

  const chiefs = await prisma.team.findUnique({ where: { name: "Chiefs FC" } });
  const avlfc = await prisma.team.findUnique({ where: { name: "AVL FC" } });

  if (chiefs && avlfc) {
    const existingMatch = await prisma.match.findFirst({
      where: {
        date: new Date("2026-02-15T19:00:00"),
      },
    });

    if (!existingMatch) {
      await prisma.match.create({
        data: {
          date: new Date("2026-02-15T19:00:00"),
          venue: "JBL Field 3, 498 Azalea Rd E, Asheville, NC 28805",
          homeTeamId: chiefs.id,
          awayTeamId: avlfc.id,
        },
      });
    }
  }

  console.log("Seed complete: 8 teams + first match created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
