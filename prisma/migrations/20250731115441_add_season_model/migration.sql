/*
  Warnings:

  - Added the required column `seasonId` to the `Triangular` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initSeasonDate" TIMESTAMP(3) NOT NULL,
    "finishSeasonDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- Insert initial season with ID that we'll use for existing triangulars
INSERT INTO "Season" ("id", "name", "initSeasonDate", "createdAt") 
VALUES ('season1_initial', 'Season 1', '2024-01-01T00:00:00.000Z', CURRENT_TIMESTAMP);

-- AlterTable: Add seasonId column with default value first
ALTER TABLE "Triangular" ADD COLUMN "seasonId" TEXT NOT NULL DEFAULT 'season1_initial';

-- Remove the default value now that all rows have been updated
ALTER TABLE "Triangular" ALTER COLUMN "seasonId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Triangular_seasonId_idx" ON "Triangular"("seasonId");

-- AddForeignKey
ALTER TABLE "Triangular" ADD CONSTRAINT "Triangular_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
