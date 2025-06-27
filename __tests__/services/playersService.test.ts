/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    player: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock PlayerStatsService
jest.mock('@/lib/services/playerStats', () => ({
  PlayerStatsService: {
    processMultiplePlayers: jest.fn(),
  },
}));

import { PlayersService } from '@/lib/services/playersService';

describe('PlayersService', () => {
  let mockPrisma: any;
  let mockPlayerStatsService: any;

  beforeAll(() => {
    const { prisma } = require('@/lib/prisma');
    mockPrisma = prisma;
    const { PlayerStatsService } = require('@/lib/services/playerStats');
    mockPlayerStatsService = PlayerStatsService;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful database connection by default
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    
    // Setup default mock for PlayerStatsService
    mockPlayerStatsService.processMultiplePlayers.mockImplementation((players: any[]) => 
      players.map((player: any) => ({
        id: player.id,
        name: player.name,
        stats: {
          matches: 0,
          goals: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
        }
      }))
    );
  });

  describe('getAllPlayers', () => {
    it('should return all players with their statistics', async () => {
      const mockPlayers = [
        {
          id: '1',
          name: 'Player 1',
          triangulars: [],
        },
        {
          id: '2', 
          name: 'Player 2',
          triangulars: [],
        },
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockPlayers);

      const result = await PlayersService.getAllPlayers();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[0]).toHaveProperty('name', 'Player 1');
      expect(result[0]).toHaveProperty('stats');
      
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
      expect(mockPrisma.player.findMany).toHaveBeenCalledWith({
        include: {
          triangulars: {
            include: {
              triangular: {
                include: {
                  teams: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw error when database connection fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      await expect(PlayersService.getAllPlayers()).rejects.toThrow('Connection failed');
    });

    it('should throw error when player query fails', async () => {
      mockPrisma.player.findMany.mockRejectedValue(new Error('Query failed'));

      await expect(PlayersService.getAllPlayers()).rejects.toThrow('Query failed');
    });
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const newPlayer = {
        id: '1',
        name: 'New Player',
        matches: 0,
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };

      mockPrisma.player.create.mockResolvedValue(newPlayer);

      const result = await PlayersService.createPlayer({ name: 'New Player' });
      
      expect(result).toEqual(newPlayer);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          name: 'New Player',
          matches: 0,
          goals: 0,
          wins: 0,
          draws: 0,
          losses: 0,
        },
      });
    });

    it('should throw error if name is missing', async () => {
      await expect(PlayersService.createPlayer({ name: '' })).rejects.toThrow('Name is required');
      await expect(PlayersService.createPlayer({} as any)).rejects.toThrow('Name is required');
      
      // Should not call database when validation fails
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
      expect(mockPrisma.player.create).not.toHaveBeenCalled();
    });

    it('should throw error when database connection fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      await expect(PlayersService.createPlayer({ name: 'Test' })).rejects.toThrow('Connection failed');
    });

    it('should throw error when player creation fails', async () => {
      mockPrisma.player.create.mockRejectedValue(new Error('Create failed'));

      await expect(PlayersService.createPlayer({ name: 'Test' })).rejects.toThrow('Create failed');
    });
  });
}); 