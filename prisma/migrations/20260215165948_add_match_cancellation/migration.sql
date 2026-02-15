-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelled" BOOLEAN NOT NULL DEFAULT false;
