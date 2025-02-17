-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Triangular" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "champion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PlayerTriangular" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "triangularId" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "normalWins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlayerTriangular_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerTriangular_triangularId_fkey" FOREIGN KEY ("triangularId") REFERENCES "Triangular" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "triangularId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "normalWins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    CONSTRAINT "TeamResult_triangularId_fkey" FOREIGN KEY ("triangularId") REFERENCES "Triangular" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerTriangular_triangularId_playerId_key" ON "PlayerTriangular"("triangularId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamResult_triangularId_teamName_key" ON "TeamResult"("triangularId", "teamName");
