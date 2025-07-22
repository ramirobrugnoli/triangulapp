import { PlayerStatsService } from '@/lib/services/playerStats';
import { Player, PlayerStats } from '@/types';

describe('PlayerStatsService', () => {
  describe('calculateMatchesPerTriangular', () => {
    it('should calculate matches correctly for triangular with 3 teams', () => {
      const teams = [
        { id: '1', triangularId: '1', teamName: 'Red', position: 1, wins: 2, draws: 0, normalWins: 0, points: 6 },
        { id: '2', triangularId: '1', teamName: 'Blue', position: 2, wins: 1, draws: 0, normalWins: 0, points: 3 },
        { id: '3', triangularId: '1', teamName: 'Green', position: 3, wins: 0, draws: 0, normalWins: 0, points: 0 },
      ];

      const matches = PlayerStatsService.calculateMatchesPerTriangular(teams);
      expect(matches).toBe(1);
    });

    it('should handle teams with different win counts', () => {
      const teams = [
        { id: '1', triangularId: '1', teamName: 'Red', position: 1, wins: 3, draws: 1, normalWins: 1, points: 10 },
        { id: '2', triangularId: '1', teamName: 'Blue', position: 2, wins: 2, draws: 1, normalWins: 0, points: 7 },
        { id: '3', triangularId: '1', teamName: 'Green', position: 3, wins: 1, draws: 1, normalWins: 0, points: 4 },
      ];

      const matches = PlayerStatsService.calculateMatchesPerTriangular(teams);
      expect(matches).toBeGreaterThan(0);
    });
  });

  describe('calculatePlayerRating', () => {
    it('should calculate a valid rating for a player', () => {
      const stats: PlayerStats = {
        goals: 10,
        wins: 5,
        draws: 2,
        losses: 3,
        matches: 10,
        points: 17,
        winPercentage: 50,
        triangularsPlayed: 3,
        triangularWins: 1,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 7,
        triangularWinPercentage: 33.33,
      };

      const rating = PlayerStatsService.calculatePlayerRating(stats);
      expect(rating).toBeGreaterThan(0);
      expect(typeof rating).toBe('number');
    });

    it('should handle zero stats', () => {
      const stats: PlayerStats = {
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matches: 0,
        points: 0,
        winPercentage: 0,
        triangularsPlayed: 0,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        triangularPoints: 0,
        triangularWinPercentage: 0,
      };

      const rating = PlayerStatsService.calculatePlayerRating(stats);
      expect(rating).toBe(0);
    });
  });

  describe('calculateRatingBreakdown', () => {
    it('should provide detailed rating breakdown', () => {
      const stats: PlayerStats = {
        goals: 10,
        wins: 5,
        draws: 2,
        losses: 3,
        matches: 10,
        points: 17,
        winPercentage: 50,
        triangularsPlayed: 3,
        triangularWins: 1,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 7,
        triangularWinPercentage: 33.33,
      };

      const breakdown = PlayerStatsService.calculateRatingBreakdown(stats);

      expect(breakdown).toHaveProperty('pointsComponent');
      expect(breakdown).toHaveProperty('winPercentageComponent');
      expect(breakdown).toHaveProperty('goalsPerMatchComponent');
      expect(breakdown).toHaveProperty('totalRating');
      expect(breakdown.totalRating).toBeGreaterThan(0);
    });
  });

  describe('calculatePlayerRatingV2', () => {
    it('should calculate a valid rating V2 for a player', () => {
      const stats: PlayerStats = {
        goals: 10,
        wins: 7,
        draws: 2,
        losses: 1,
        matches: 10,
        points: 23,
        winPercentage: 70,
        triangularsPlayed: 5,
        triangularWins: 3,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 12,
        triangularWinPercentage: 60,
      };

      const ratingV2 = PlayerStatsService.calculatePlayerRatingV2(stats);
      expect(ratingV2).toBeGreaterThan(0);
      expect(typeof ratingV2).toBe('number');
      // (60 * 0.6) + (70 * 0.4) = 36 + 28 = 64
      expect(ratingV2).toBe(64);
    });

    it('should return 0 for player with no stats', () => {
      const stats: PlayerStats = {
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matches: 0,
        points: 0,
        winPercentage: 0,
        triangularsPlayed: 0,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        triangularPoints: 0,
        triangularWinPercentage: 0,
      };

      const ratingV2 = PlayerStatsService.calculatePlayerRatingV2(stats);
      expect(ratingV2).toBe(0);
    });
  });

  describe('calculateRatingV2Breakdown', () => {
    it('should provide detailed rating V2 breakdown', () => {
      const stats: PlayerStats = {
        goals: 8,
        wins: 6,
        draws: 2,
        losses: 2,
        matches: 10,
        points: 20,
        winPercentage: 60,
        triangularsPlayed: 4,
        triangularWins: 2,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 9,
        triangularWinPercentage: 50,
      };

      const breakdown = PlayerStatsService.calculateRatingV2Breakdown(stats);

      expect(breakdown).toHaveProperty('winPercentageComponent');
      expect(breakdown).toHaveProperty('triangularWinPercentageComponent');
      expect(breakdown).toHaveProperty('totalRatingV2');
      expect(breakdown.totalRatingV2).toBeGreaterThan(0);
      // (50 * 0.6) + (60 * 0.4) = 30 + 24 = 54
      expect(breakdown.totalRatingV2).toBe(54);
      expect(breakdown.winPercentageComponent).toBe(24);
      expect(breakdown.triangularWinPercentageComponent).toBe(30);
    });
  });

  describe('calculatePerformanceData', () => {
    it('should calculate performance percentages correctly', () => {
      const stats: PlayerStats = {
        goals: 10,
        wins: 5,
        draws: 2,
        losses: 3,
        matches: 10,
        points: 17,
        winPercentage: 50,
        triangularsPlayed: 3,
        triangularWins: 1,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 7,
        triangularWinPercentage: 33.33,
      };

      const performance = PlayerStatsService.calculatePerformanceData(stats);

      expect(performance.winPercentage).toBe(50);
      expect(performance.drawPercentage).toBe(20);
      expect(performance.lossPercentage).toBe(30);
      expect(performance.goalsPerMatch).toBe(1);
    });

    it('should handle zero matches', () => {
      const stats: PlayerStats = {
        goals: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        matches: 0,
        points: 0,
        winPercentage: 0,
        triangularsPlayed: 0,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        triangularPoints: 0,
        triangularWinPercentage: 0,
      };

      const performance = PlayerStatsService.calculatePerformanceData(stats);

      expect(performance.winPercentage).toBe(0);
      expect(performance.drawPercentage).toBe(0);
      expect(performance.lossPercentage).toBe(0);
      expect(performance.goalsPerMatch).toBe(0);
    });
  });

  describe('calculateGoalsPerMatch', () => {
    it('should calculate goals per match correctly', () => {
      const goalsPerMatch = PlayerStatsService.calculateGoalsPerMatch(10, 5);
      expect(goalsPerMatch).toBe(2);
    });

    it('should handle zero matches', () => {
      const goalsPerMatch = PlayerStatsService.calculateGoalsPerMatch(10, 0);
      expect(goalsPerMatch).toBe(0);
    });
  });

  describe('calculateMaxValues', () => {
    it('should calculate max values from players array', () => {
      const players = [
        {
          id: '1',
          name: 'Player 1',
          stats: {
            goals: 10,
            wins: 5,
            draws: 2,
            losses: 3,
            matches: 10,
            points: 17,
            winPercentage: 50,
            triangularsPlayed: 3,
            triangularWins: 1,
            triangularSeconds: 1,
            triangularThirds: 1,
            triangularPoints: 7,
            triangularWinPercentage: 33.33,
          },
        },
        {
          id: '2',
          name: 'Player 2',
          stats: {
            goals: 15,
            wins: 8,
            draws: 1,
            losses: 1,
            matches: 10,
            points: 25,
            winPercentage: 80,
            triangularsPlayed: 5,
            triangularWins: 3,
            triangularSeconds: 2,
            triangularThirds: 0,
            triangularPoints: 13,
            triangularWinPercentage: 60,
          },
        },
      ];

      const maxValues = PlayerStatsService.calculateMaxValues(players);

      expect(maxValues.goals).toBe(15);
      expect(maxValues.victories).toBe(8);
      expect(maxValues.points).toBe(25);
      expect(maxValues.triangularWins).toBe(3);
    });

    it('should handle empty players array', () => {
      const maxValues = PlayerStatsService.calculateMaxValues([]);

      expect(maxValues.goals).toBe(1);
      expect(maxValues.victories).toBe(1);
      expect(maxValues.points).toBe(1);
      expect(maxValues.triangularWins).toBe(1);
    });
  });

  describe('calculatePlayersRatings', () => {
    it('should calculate ratings for multiple players', () => {
      const players = [
        {
          id: '1',
          name: 'Player 1',
          stats: {
            goals: 10,
            wins: 5,
            draws: 2,
            losses: 3,
            matches: 10,
            points: 17,
            winPercentage: 50,
            triangularsPlayed: 3,
            triangularWins: 1,
            triangularSeconds: 1,
            triangularThirds: 1,
            triangularPoints: 7,
            triangularWinPercentage: 33.33,
          },
        },
        {
          id: '2',
          name: 'Player 2',
          stats: {
            goals: 15,
            wins: 8,
            draws: 1,
            losses: 1,
            matches: 10,
            points: 25,
            winPercentage: 80,
            triangularsPlayed: 5,
            triangularWins: 3,
            triangularSeconds: 2,
            triangularThirds: 0,
            triangularPoints: 13,
            triangularWinPercentage: 60,
          },
        },
      ];

      const ratings = PlayerStatsService.calculatePlayersRatings(players);

      expect(ratings).toHaveProperty('1');
      expect(ratings).toHaveProperty('2');
      expect(typeof ratings['1']).toBe('number');
      expect(typeof ratings['2']).toBe('number');
    });
  });

  describe('calculatePlayersRatingsV2', () => {
    it('should calculate ratings V2 for multiple players', () => {
      const players: Player[] = [
        {
          id: '1',
          name: 'Player 1',
          stats: {
            matches: 10,
            goals: 8,
            wins: 7,
            draws: 2,
            losses: 1,
            points: 23,
            winPercentage: 70,
            triangularsPlayed: 4,
            triangularWins: 3,
            triangularSeconds: 1,
            triangularThirds: 0,
            triangularPoints: 12,
            triangularWinPercentage: 75,
          },
        },
        {
          id: '2',
          name: 'Player 2',
          stats: {
            matches: 8,
            goals: 5,
            wins: 4,
            draws: 2,
            losses: 2,
            points: 14,
            winPercentage: 50,
            triangularsPlayed: 3,
            triangularWins: 1,
            triangularSeconds: 1,
            triangularThirds: 1,
            triangularPoints: 6,
            triangularWinPercentage: 33.33,
          },
        },
      ];

      const ratingsV2 = PlayerStatsService.calculatePlayersRatingsV2(players);

      expect(ratingsV2).toHaveProperty('1');
      expect(ratingsV2).toHaveProperty('2');
      expect(typeof ratingsV2['1']).toBe('number');
      expect(typeof ratingsV2['2']).toBe('number');
      // Player 1: (75 * 0.6) + (70 * 0.4) = 45 + 28 = 73
      expect(ratingsV2['1']).toBe(73);
      // Player 2: (33.33 * 0.6) + (50 * 0.4) = 20 + 20 = 40
      expect(ratingsV2['2']).toBe(40);
    });
  });

  describe('sortPlayersByMetric', () => {
    const players = [
      {
        id: '1',
        name: 'Player 1',
        stats: {
          goals: 10,
          wins: 5,
          points: 17,
          draws: 2,
          losses: 3,
          matches: 10,
          winPercentage: 50,
          triangularsPlayed: 3,
          triangularWins: 1,
          triangularSeconds: 1,
          triangularThirds: 1,
          triangularPoints: 7,
          triangularWinPercentage: 33.33,
        },
      },
      {
        id: '2',
        name: 'Player 2',
        stats: {
          goals: 15,
          wins: 8,
          points: 25,
          draws: 1,
          losses: 1,
          matches: 10,
          winPercentage: 80,
          triangularsPlayed: 5,
          triangularWins: 3,
          triangularSeconds: 2,
          triangularThirds: 0,
          triangularPoints: 13,
          triangularWinPercentage: 60,
        },
      },
    ];

    it('should sort players by goals', () => {
      const sorted = PlayerStatsService.sortPlayersByMetric(players, 'goals');
      expect(sorted[0].stats.goals).toBe(15);
      expect(sorted[1].stats.goals).toBe(10);
    });

    it('should sort players by wins', () => {
      const sorted = PlayerStatsService.sortPlayersByMetric(players, 'wins');
      expect(sorted[0].stats.wins).toBe(8);
      expect(sorted[1].stats.wins).toBe(5);
    });

    it('should sort players by points', () => {
      const sorted = PlayerStatsService.sortPlayersByMetric(players, 'points');
      expect(sorted[0].stats.points).toBe(25);
      expect(sorted[1].stats.points).toBe(17);
    });

    it('should sort players by rating', () => {
      const sorted = PlayerStatsService.sortPlayersByMetric(players, 'rating');
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('calculateTriangularStats', () => {
    it('should calculate triangular stats correctly', () => {
      const playerTriangulars = [
        {
          triangular: {
            teams: [
              { id: '1', triangularId: '1', teamName: 'Red', position: 1, wins: 2, draws: 0, normalWins: 1, points: 7 },
              { id: '2', triangularId: '1', teamName: 'Blue', position: 2, wins: 1, draws: 0, normalWins: 0, points: 3 },
              { id: '3', triangularId: '1', teamName: 'Green', position: 3, wins: 0, draws: 0, normalWins: 0, points: 0 },
            ],
          },
          team: 'Red',
        },
        {
          triangular: {
            teams: [
              { id: '4', triangularId: '2', teamName: 'Red', position: 2, wins: 1, draws: 1, normalWins: 0, points: 4 },
              { id: '5', triangularId: '2', teamName: 'Blue', position: 1, wins: 2, draws: 0, normalWins: 1, points: 7 },
              { id: '6', triangularId: '2', teamName: 'Yellow', position: 3, wins: 0, draws: 1, normalWins: 0, points: 1 },
            ],
          },
          team: 'Red',
        },
      ];

      const stats = PlayerStatsService.calculateTriangularStats(playerTriangulars);

      expect(stats.triangularsPlayed).toBe(2);
      expect(stats.triangularWins).toBe(1);
      expect(stats.triangularSeconds).toBe(1);
      expect(stats.triangularThirds).toBe(0);
      expect(stats.triangularPoints).toBe(7);
      expect(stats.matchesWon).toBe(4);
      expect(stats.matchesDraw).toBe(1);
    });

    it('should handle empty triangular data', () => {
      const stats = PlayerStatsService.calculateTriangularStats([]);

      expect(stats.triangularsPlayed).toBe(0);
      expect(stats.triangularWins).toBe(0);
      expect(stats.triangularSeconds).toBe(0);
      expect(stats.triangularThirds).toBe(0);
      expect(stats.triangularPoints).toBe(0);
      expect(stats.matches).toBe(0);
    });
  });

  describe('calculatePlayerStats', () => {
    it('should calculate complete player stats', () => {
      const player = {
        id: '1',
        name: 'Player 1',
        goals: 10,
        wins: 5,
        draws: 2,
        matches: 10,
        losses: 3,
      };

      const triangularStats = {
        matches: 10,
        matchesWon: 5,
        matchesDraw: 2,
        matchesLost: 3,
        triangularsPlayed: 3,
        triangularWins: 1,
        triangularSeconds: 1,
        triangularThirds: 1,
        triangularPoints: 8,
      };

      const stats = PlayerStatsService.calculatePlayerStats(player, triangularStats);

      expect(stats.matches).toBe(10);
      expect(stats.goals).toBe(10);
      expect(stats.wins).toBe(5);
      expect(stats.draws).toBe(2);
      expect(stats.points).toBe(17);
      expect(stats.triangularsPlayed).toBe(3);
      expect(stats.triangularWins).toBe(1);
      expect(stats.triangularPoints).toBe(8);
    });

    it('should handle zero matches for percentage calculations', () => {
      const player = {
        id: '1',
        name: 'Player 1',
        goals: 0,
        wins: 0,
        draws: 0,
        matches: 0,
        losses: 0,
      };

      const triangularStats = {
        matches: 0,
        matchesWon: 0,
        matchesDraw: 0,
        matchesLost: 0,
        triangularsPlayed: 0,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        triangularPoints: 0,
      };

      const stats = PlayerStatsService.calculatePlayerStats(player, triangularStats);

      expect(stats.winPercentage).toBe(0);
      expect(stats.triangularWinPercentage).toBe(0);
    });
  });

  describe('processPlayerWithTriangulars', () => {
    it('should process player with triangular data correctly', () => {
      const playerData = {
        id: '1',
        name: 'Player 1',
        goals: 10,
        wins: 5,
        draws: 2,
        matches: 10,
        losses: 3,
        triangulars: [
          {
            triangular: {
              teams: [
                { id: '1', triangularId: '1', teamName: 'Red', position: 1, wins: 2, draws: 0, normalWins: 1, points: 7 },
                { id: '2', triangularId: '1', teamName: 'Blue', position: 2, wins: 1, draws: 0, normalWins: 0, points: 3 },
                { id: '3', triangularId: '1', teamName: 'Green', position: 3, wins: 0, draws: 0, normalWins: 0, points: 0 },
              ],
            },
            team: 'Red',
          },
        ],
      };

      const player = PlayerStatsService.processPlayerWithTriangulars(playerData);

      expect(player.id).toBe('1');
      expect(player.name).toBe('Player 1');
      expect(player.stats).toBeDefined();
      expect(player.stats.goals).toBe(10);
      expect(player.stats.triangularsPlayed).toBe(1);
    });
  });

  describe('processMultiplePlayers', () => {
    it('should process multiple players', () => {
      const playersData = [
        {
          id: '1',
          name: 'Player 1',
          goals: 10,
          wins: 5,
          draws: 2,
          matches: 10,
          losses: 3,
          triangulars: [
            {
              triangular: {
                teams: [
                  { id: '1', triangularId: '1', teamName: 'Red', position: 1, wins: 2, draws: 0, normalWins: 1, points: 7 },
                  { id: '2', triangularId: '1', teamName: 'Blue', position: 2, wins: 1, draws: 0, normalWins: 0, points: 3 },
                  { id: '3', triangularId: '1', teamName: 'Green', position: 3, wins: 0, draws: 0, normalWins: 0, points: 0 },
                ],
              },
              team: 'Red',
            },
          ],
        },
        {
          id: '2',
          name: 'Player 2',
          goals: 15,
          wins: 8,
          draws: 1,
          matches: 10,
          losses: 1,
          triangulars: [],
        },
      ];

      const players = PlayerStatsService.processMultiplePlayers(playersData);

      expect(players).toHaveLength(2);
      expect(players[0].id).toBe('1');
      expect(players[1].id).toBe('2');
      expect(players[0].stats).toBeDefined();
      expect(players[1].stats).toBeDefined();
    });
  });

  describe('calculateTriangularAverages', () => {
    it('should calculate triangular averages correctly', () => {
      const stats: PlayerStats = {
        goals: 15,
        wins: 9,
        draws: 3,
        losses: 3,
        matches: 15,
        points: 30,
        winPercentage: 60,
        triangularsPlayed: 3,
        triangularWins: 2,
        triangularSeconds: 1,
        triangularThirds: 0,
        triangularPoints: 12,
        triangularWinPercentage: 67,
      };

      const averages = PlayerStatsService.calculateTriangularAverages(stats);

      expect(averages.pointsPerTriangular).toBe(10);
      expect(averages.winsPerTriangular).toBe(3);
      expect(averages.goalsPerTriangular).toBe(5);
      expect(averages.matchesPerTriangular).toBe(5);
    });

    it('should handle zero triangulars played', () => {
      const stats: PlayerStats = {
        goals: 15,
        wins: 9,
        draws: 3,
        losses: 3,
        matches: 15,
        points: 30,
        winPercentage: 60,
        triangularsPlayed: 0,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        triangularPoints: 0,
        triangularWinPercentage: 0,
      };

      const averages = PlayerStatsService.calculateTriangularAverages(stats);

      expect(averages.pointsPerTriangular).toBe(0);
      expect(averages.winsPerTriangular).toBe(0);
      expect(averages.goalsPerTriangular).toBe(0);
      expect(averages.matchesPerTriangular).toBe(0);
    });
  });
}); 