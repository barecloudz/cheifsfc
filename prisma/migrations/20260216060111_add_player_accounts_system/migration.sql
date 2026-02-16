-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "pointBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unlockedCardTypes" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "pointsPerTraining" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "upgradeCost" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRsvp" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'none',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRsvp_trainingId_playerId_key" ON "TrainingRsvp"("trainingId", "playerId");

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRsvp" ADD CONSTRAINT "TrainingRsvp_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRsvp" ADD CONSTRAINT "TrainingRsvp_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
