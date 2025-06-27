import { api } from '@/lib/api';
import { Player, TriangularResult, TriangularHistory } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Player Service', () => {
    describe('getAllPlayers', () => {
      it('should fetch all players successfully', async () => {
        const mockPlayers: Player[] = [
          {
            id: '1',
            name: 'Player 1',
            stats: {
              matches: 10,
              goals: 5,
              wins: 7,
              draws: 2,
              losses: 1,
              points: 23,
              winPercentage: 70,
              triangularsPlayed: 3,
              triangularWins: 1,
              triangularSeconds: 1,
              triangularThirds: 1,
              triangularPoints: 8,
              triangularWinPercentage: 33.33
            }
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockPlayers),
        } as any);

        const result = await api.players.getAllPlayers();

        expect(mockFetch).toHaveBeenCalledWith('/api/players');
        expect(result).toEqual(mockPlayers);
      });

      it('should handle fetch error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
        } as any);

        await expect(api.players.getAllPlayers()).rejects.toThrow('Network response was not ok');
      });

      it('should handle network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(api.players.getAllPlayers()).rejects.toThrow('Network error');
      });
    });

    describe('getSimplePlayers', () => {
      it('should fetch simple players successfully', async () => {
        const mockPlayers: Player[] = [
          {
            id: '1',
            name: 'Player 1',
            stats: {
              matches: 0,
              goals: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              winPercentage: 0,
              triangularsPlayed: 0,
              triangularWins: 0,
              triangularSeconds: 0,
              triangularThirds: 0,
              triangularPoints: 0,
              triangularWinPercentage: 0
            }
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockPlayers),
        } as any);

        const result = await api.players.getSimplePlayers();

        expect(mockFetch).toHaveBeenCalledWith('/api/players/simple');
        expect(result).toEqual(mockPlayers);
      });
    });

    describe('getPlayerStatsByIds', () => {
      it('should fetch player stats by IDs successfully', async () => {
        const playerIds = ['1', '2'];
        const mockPlayers: Player[] = [
          {
            id: '1',
            name: 'Player 1',
            stats: {
              matches: 10,
              goals: 5,
              wins: 7,
              draws: 2,
              losses: 1,
              points: 23,
              winPercentage: 70,
              triangularsPlayed: 3,
              triangularWins: 1,
              triangularSeconds: 1,
              triangularThirds: 1,
              triangularPoints: 8,
              triangularWinPercentage: 33.33
            }
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockPlayers),
        } as any);

        const result = await api.players.getPlayerStatsByIds(playerIds);

        expect(mockFetch).toHaveBeenCalledWith('/api/players/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playerIds }),
        });
        expect(result).toEqual(mockPlayers);
      });

      it('should handle API error response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: 'Player not found' }),
        } as any);

        await expect(api.players.getPlayerStatsByIds(['1']))
          .rejects.toThrow('Player not found');
      });
    });

    describe('recalculateStats', () => {
      it('should recalculate stats successfully', async () => {
        const mockResponse = {
          success: true,
          message: 'Stats recalculated',
          triangularsProcessed: 5
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        } as any);

        const result = await api.players.recalculateStats();

        expect(mockFetch).toHaveBeenCalledWith('/api/players/recalculate-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getPlayerTriangulars', () => {
      it('should fetch player triangulars successfully', async () => {
        const playerId = '1';
        const mockTriangulars = [
          {
            id: 'triangular-1',
            date: '2023-12-01T10:00:00Z',
            team: 'Equipo 1',
            position: 1,
            goals: 3,
            wins: 2,
            draws: 0,
            teamPoints: 6
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockTriangulars),
        } as any);

        const result = await api.players.getPlayerTriangulars(playerId);

        expect(mockFetch).toHaveBeenCalledWith(`/api/players/${playerId}/triangulars`);
        expect(result).toEqual(mockTriangulars);
      });
    });
  });

  describe('Triangular Service', () => {
    describe('postTriangularResult', () => {
      it('should post triangular result successfully', async () => {
        const mockResult: TriangularResult = {
          date: '2023-12-01T10:00:00Z',
          teams: {
            first: {
              name: 'Equipo 1',
              players: ['1', '2'],
              points: 6,
              wins: 2,
              normalWins: 0,
              draws: 0
            },
            second: {
              name: 'Equipo 2',
              players: ['3', '4'],
              points: 3,
              wins: 1,
              normalWins: 0,
              draws: 0
            },
            third: {
              name: 'Equipo 3',
              players: ['5', '6'],
              points: 0,
              wins: 0,
              normalWins: 0,
              draws: 0
            }
          },
          scorers: {
            '1': 3,
            '2': 1
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
        } as any);

        await api.triangular.postTriangularResult(mockResult);

        expect(mockFetch).toHaveBeenCalledWith('/api/triangular', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockResult),
        });
      });

      it('should handle post triangular error', async () => {
        const mockResult: TriangularResult = {
          date: '2023-12-01T10:00:00Z',
          teams: {
            first: { name: 'Equipo 1', players: ['1'], points: 6, wins: 2, normalWins: 0, draws: 0 },
            second: { name: 'Equipo 2', players: ['2'], points: 3, wins: 1, normalWins: 0, draws: 0 },
            third: { name: 'Equipo 3', players: ['3'], points: 0, wins: 0, normalWins: 0, draws: 0 }
          },
          scorers: {}
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: 'Validation error' }),
        } as any);

        await expect(api.triangular.postTriangularResult(mockResult))
          .rejects.toThrow('Validation error');
      });
    });

    describe('getTriangularHistory', () => {
      it('should fetch triangular history successfully', async () => {
        const mockHistory: TriangularHistory[] = [
          {
            id: 'triangular-1',
            date: '2023-12-01T10:00:00Z',
            champion: 'Equipo 1',
            teams: [
              { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 }
            ],
            scorers: [
              { name: 'Player 1', goals: 3, team: 'Equipo 1' }
            ]
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockHistory),
        } as any);

        const result = await api.triangular.getTriangularHistory();

        expect(mockFetch).toHaveBeenCalledWith('/api/triangular/history');
        expect(result).toEqual(mockHistory);
      });
    });

    describe('getAllTriangulars', () => {
      it('should fetch all triangulars successfully', async () => {
        const mockTriangulars: TriangularHistory[] = [
          {
            id: 'triangular-1',
            date: '2023-12-01T10:00:00Z',
            champion: 'Equipo 1',
            teams: [
              { name: 'Equipo 1', points: 6, position: 1, wins: 2, normalWins: 0, draws: 0 }
            ],
            scorers: [
              { name: 'Player 1', goals: 3, team: 'Equipo 1' }
            ]
          }
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockTriangulars),
        } as any);

        const result = await api.triangular.getAllTriangulars();

        expect(mockFetch).toHaveBeenCalledWith('/api/triangular');
        expect(result).toEqual(mockTriangulars);
      });
    });

    describe('updateTriangular', () => {
      it('should update triangular successfully', async () => {
        const triangularId = 'triangular-1';
        const updateData = { champion: 'Equipo 2', date: '2023-12-02' };
        const mockUpdatedTriangular: TriangularHistory = {
          id: triangularId,
          date: '2023-12-02T10:00:00Z',
          champion: 'Equipo 2',
          teams: [],
          scorers: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockUpdatedTriangular),
        } as any);

        const result = await api.triangular.updateTriangular(triangularId, updateData);

        expect(mockFetch).toHaveBeenCalledWith(`/api/triangular/${triangularId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        expect(result).toEqual(mockUpdatedTriangular);
      });
    });

    describe('deleteTriangular', () => {
      it('should delete triangular successfully', async () => {
        const triangularId = 'triangular-1';

        mockFetch.mockResolvedValueOnce({
          ok: true,
        } as any);

        await api.triangular.deleteTriangular(triangularId);

        expect(mockFetch).toHaveBeenCalledWith(`/api/triangular/${triangularId}`, {
          method: 'DELETE',
        });
      });

      it('should handle delete triangular error', async () => {
        const triangularId = 'triangular-1';

        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: jest.fn().mockResolvedValueOnce({ message: 'Triangular not found' }),
        } as any);

        await expect(api.triangular.deleteTriangular(triangularId))
          .rejects.toThrow('Triangular not found');
      });
    });
  });
}); 