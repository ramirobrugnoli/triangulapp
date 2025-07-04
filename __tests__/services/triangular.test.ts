import { triangularService } from "@/lib/services/triangular";
import { mockPlayers } from "@/store/mocks/stats";
import type { TriangularResult } from "@/types";
import { PrismaClient } from "@prisma/client";

// Mock the prisma module
jest.mock("@/lib/prisma", () => {
  const mockCreate = jest.fn();
  const mockFindMany = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockUpdateMany = jest.fn();
  const mockCreateMany = jest.fn();
  const mockTransaction = jest.fn();

  return {
    prisma: {
      triangular: {
        create: mockCreate,
        findMany: mockFindMany,
        update: mockUpdate,
        delete: mockDelete,
      },
      player: {
        update: mockUpdate,
        updateMany: mockUpdateMany,
      },
      playerTriangular: {
        createMany: mockCreateMany,
      },
      $transaction: mockTransaction,
    },
  };
});

// Get the mocked functions
const mockPrisma = jest.requireMock("@/lib/prisma").prisma;

describe("triangularService", () => {
  const mockTriangularResult: TriangularResult = {
    date: new Date().toISOString(),
    teams: [
      {
        name: "Equipo 1",
        players: [mockPlayers[0].id, mockPlayers[1].id],
        points: 6,
        wins: 2,
        normalWins: 1,
        draws: 0,
        position: 1,
      },
      {
        name: "Equipo 2",
        players: [mockPlayers[2].id, mockPlayers[3].id],
        points: 3,
        wins: 1,
        normalWins: 1,
        draws: 0,
        position: 2,
      },
      {
        name: "Equipo 3",
        players: [mockPlayers[4].id, mockPlayers[5].id],
        points: 0,
        wins: 0,
        normalWins: 0,
        draws: 0,
        position: 3,
      },
    ],
    scorers: {
      [mockPlayers[0].id]: 2,
      [mockPlayers[1].id]: 1,
      [mockPlayers[2].id]: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((callback: (prisma: PrismaClient) => Promise<any>) => callback(mockPrisma as unknown as PrismaClient));
  });

  describe("saveTriangular", () => {
    const mockCreatedTriangular = {
      id: "mock-triangular-id",
      date: new Date(),
      champion: "Equipo 1",
    };

    beforeEach(() => {
      mockPrisma.triangular.create.mockResolvedValue(mockCreatedTriangular);
      mockPrisma.playerTriangular.createMany.mockResolvedValue({ count: 6 });
      mockPrisma.player.update.mockResolvedValue({});
    });

    it("creates a new triangular with teams and player records", async () => {
      await triangularService.saveTriangular(mockTriangularResult);

      const createCall = mockPrisma.triangular.create.mock.calls[0][0];
      expect(createCall).toMatchObject({
        data: {
          champion: "Equipo 1",
          teams: {
            create: expect.arrayContaining([
              expect.objectContaining({
                teamName: "Equipo 1",
                points: 6,
                position: 1,
              }),
            ]),
          },
        },
      });
    });

    it("creates player triangular records for all participants", async () => {
      await triangularService.saveTriangular(mockTriangularResult);

      const createManyCall = mockPrisma.playerTriangular.createMany.mock.calls[0][0];
      expect(createManyCall).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            playerId: mockPlayers[0].id,
            goals: 2,
            team: "Equipo 1",
          }),
        ]),
      });
    });

    it("updates player statistics", async () => {
      await triangularService.saveTriangular(mockTriangularResult);

      const updateCalls = mockPrisma.player.update.mock.calls;
      expect(updateCalls[0][0]).toMatchObject({
        where: { id: mockPlayers[0].id },
        data: {
          goals: { increment: 2 },
          matches: { increment: 2 },
          wins: { increment: 2 },
        },
      });
    });

    it("handles transaction errors", async () => {
      const error = new Error("Transaction failed");
      mockPrisma.$transaction.mockRejectedValueOnce(error);

      await expect(triangularService.saveTriangular(mockTriangularResult)).rejects.toThrow("Transaction failed");
    });
  });

  describe("recalculateAllPlayerStats", () => {
    const mockTriangulars = [
      {
        id: "1",
        players: [
          { playerId: mockPlayers[0].id, wins: 2, draws: 0, goals: 2, player: mockPlayers[0] },
          { playerId: mockPlayers[1].id, wins: 1, draws: 1, goals: 1, player: mockPlayers[1] },
        ],
      },
    ];

    beforeEach(() => {
      mockPrisma.triangular.findMany.mockResolvedValue(mockTriangulars);
      mockPrisma.player.updateMany.mockResolvedValue({});
      mockPrisma.player.update.mockResolvedValue({});
    });

    it("resets all player stats before recalculation", async () => {
      await triangularService.recalculateAllPlayerStats();

      const updateManyCall = mockPrisma.player.updateMany.mock.calls[0][0];
      expect(updateManyCall).toMatchObject({
        data: {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
        },
      });
    });

    it("recalculates player stats based on triangular history", async () => {
      await triangularService.recalculateAllPlayerStats();

      const updateCalls = mockPrisma.player.update.mock.calls;
      expect(updateCalls[0][0]).toMatchObject({
        where: { id: mockPlayers[0].id },
        data: {
          matches: 2,
          wins: 2,
          draws: 0,
          goals: 2,
        },
      });
    });

    it("handles transaction errors during recalculation", async () => {
      const error = new Error("Recalculation failed");
      mockPrisma.$transaction.mockRejectedValueOnce(error);

      await expect(triangularService.recalculateAllPlayerStats()).rejects.toThrow("Recalculation failed");
    });
  });

  describe("getTriangularHistory", () => {
    const mockTriangularHistory = [
      {
        id: "1",
        date: new Date(),
        champion: "Equipo 1",
        teams: [
          { teamName: "Equipo 1", points: 6, position: 1, wins: 2, normalWins: 1, draws: 0 },
        ],
        players: [
          { player: { name: "Player 1" }, goals: 2, team: "Equipo 1" },
        ],
      },
    ];

    beforeEach(() => {
      mockPrisma.triangular.findMany.mockResolvedValue(mockTriangularHistory);
    });

    it("retrieves triangular history with teams and scorers", async () => {
      const history = await triangularService.getTriangularHistory();

      expect(mockPrisma.triangular.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          teams: expect.any(Object),
          players: expect.any(Object),
        }),
        orderBy: { date: "desc" },
      });

      expect(history).toHaveLength(mockTriangularHistory.length);
    });

    it("handles empty history", async () => {
      mockPrisma.triangular.findMany.mockResolvedValue([]);
      const history = await triangularService.getTriangularHistory();
      expect(history).toHaveLength(0);
    });
  });
}); 