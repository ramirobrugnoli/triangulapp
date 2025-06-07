import { Player, PlayerStats } from "@/types";
import { TeamResult, Player as PrismaPlayer } from "@prisma/client";

/**
 * PlayerStatsService - Servicio centralizado para todos los cálculos de estadísticas de jugadores
 * 
 * Este servicio es la ÚNICA fuente de verdad para:
 * - ✅ Cálculo de rating de jugadores (fórmula oficial para equipos sugeridos)
 * - ✅ Cálculo de datos de rendimiento (porcentajes, promedios)
 * - ✅ Cálculo de partidos jugados en triangulares
 * - ✅ Estadísticas completas de triangulares
 * - ✅ Desglose detallado del rating
 * - ✅ Ordenamiento de jugadores por métricas
 * - ✅ Cálculo de valores máximos para visualizaciones
 * - ✅ Goles por partido
 * 
 * Usado por:
 * - 🎯 TeamsBuilder (rating para equipos sugeridos)
 * - 📊 PlayerStatsCharts (todos los gráficos)
 * - 📈 APIs de estadísticas (/api/players, /api/players/stats)
 * - 🏆 Componentes de visualización
 * 
 * ⚠️ NO duplicar esta lógica en otros lugares
 */

export interface PlayerTriangularData {
  triangular: {
    teams: TeamResult[];
  };
  team: string;
}

export interface TriangularStatsResult {
  matches: number;
  matchesWon: number;
  matchesDraw: number;
  triangularsPlayed: number;
  triangularWins: number;
  triangularSeconds: number;
  triangularThirds: number;
  triangularPoints: number;
}

export interface PerformanceData {
  winPercentage: number;
  drawPercentage: number;
  lossPercentage: number;
  goalsPerMatch: number;
}

export interface RatingBreakdown {
  pointsComponent: number;
  winPercentageComponent: number;
  goalsPerMatchComponent: number;
  totalRating: number;
}

export interface TriangularAverages {
  pointsPerTriangular: number;
  winsPerTriangular: number;
  goalsPerTriangular: number;
  matchesPerTriangular: number;
}

export class PlayerStatsService {
  /**
   * Calcula partidos jugados en un triangular específico
   * Fórmula: (suma de victorias + suma de empates) / 2
   */
  static calculateMatchesPerTriangular(teams: TeamResult[]): number {
    const totalWinsAndDraws = teams.reduce((total, team) => {
      return total + team.wins + team.normalWins + team.draws;
    }, 0);

    return Math.floor(totalWinsAndDraws / 2);
  }

  /**
   * Calcula el rating de un jugador usando la fórmula oficial
   * Fórmula: (puntos × 0.4) + (% victorias × 0.35) + (goles/partido × 25)
   */
  static calculatePlayerRating(stats: PlayerStats): number {
    const goalsPerMatch = stats.matches > 0 ? stats.goals / stats.matches : 0;
    const winPercentage = stats.winPercentage || 0;

    const rating = (stats.points * 0.4) + (winPercentage * 0.35) + (goalsPerMatch * 25);
    return Math.round(rating * 100) / 100;
  }

  /**
   * Calcula el desglose detallado del rating
   */
  static calculateRatingBreakdown(stats: PlayerStats): RatingBreakdown {
    const goalsPerMatch = stats.matches > 0 ? stats.goals / stats.matches : 0;
    const winPercentage = stats.winPercentage || 0;

    const pointsComponent = Math.round(stats.points * 0.4 * 100) / 100;
    const winPercentageComponent = Math.round(winPercentage * 0.35 * 100) / 100;
    const goalsPerMatchComponent = Math.round(goalsPerMatch * 25 * 100) / 100;
    const totalRating = pointsComponent + winPercentageComponent + goalsPerMatchComponent;

    return {
      pointsComponent,
      winPercentageComponent,
      goalsPerMatchComponent,
      totalRating: Math.round(totalRating * 100) / 100
    };
  }

  /**
   * Calcula datos de rendimiento (porcentajes y promedios)
   */
  static calculatePerformanceData(stats: PlayerStats): PerformanceData {
    const totalMatches = stats.matches;
    const winPercentage = totalMatches > 0 ? (stats.wins / totalMatches) * 100 : 0;
    const drawPercentage = totalMatches > 0 ? (stats.draws / totalMatches) * 100 : 0;
    const lossPercentage = totalMatches > 0 ? (stats.losses / totalMatches) * 100 : 0;
    const goalsPerMatch = totalMatches > 0 ? stats.goals / totalMatches : 0;

    return {
      winPercentage: Math.round(winPercentage),
      drawPercentage: Math.round(drawPercentage),
      lossPercentage: Math.round(lossPercentage),
      goalsPerMatch: Math.round(goalsPerMatch * 100) / 100,
    };
  }

  /**
   * Calcula goles por partido para un jugador
   */
  static calculateGoalsPerMatch(goals: number, matches: number): number {
    return matches > 0 ? Math.round((goals / matches) * 100) / 100 : 0;
  }

  /**
   * Calcula valores máximos para un conjunto de jugadores
   */
  static calculateMaxValues(players: Player[]) {
    if (players.length === 0) {
      return {
        victories: 1,
        triangularWins: 1,
        goals: 1,
        points: 1,
        matches: 1,
        triangulars: 1,
      };
    }

    return {
      victories: Math.max(...players.map(p => p.stats.wins), 1),
      triangularWins: Math.max(...players.map(p => p.stats.triangularWins || 0), 1),
      goals: Math.max(...players.map(p => p.stats.goals), 1),
      points: Math.max(...players.map(p => p.stats.points), 1),
      matches: Math.max(...players.map(p => p.stats.matches), 1),
      triangulars: Math.max(...players.map(p => p.stats.triangularsPlayed || 0), 1),
    };
  }

  /**
   * Calcula ratings para múltiples jugadores
   */
  static calculatePlayersRatings(players: Player[]): { [playerId: string]: number } {
    const ratings: { [playerId: string]: number } = {};

    players.forEach(player => {
      ratings[player.id] = this.calculatePlayerRating(player.stats);
    });

    return ratings;
  }

  /**
   * Ordena jugadores por una métrica específica
   */
  static sortPlayersByMetric(players: Player[], metric: 'goals' | 'wins' | 'points' | 'rating'): Player[] {
    return [...players].sort((a, b) => {
      switch (metric) {
        case 'goals':
          return b.stats.goals - a.stats.goals;
        case 'wins':
          return b.stats.wins - a.stats.wins;
        case 'points':
          return b.stats.points - a.stats.points;
        case 'rating':
          const ratingA = this.calculatePlayerRating(a.stats);
          const ratingB = this.calculatePlayerRating(b.stats);
          return ratingB - ratingA;
        default:
          return 0;
      }
    });
  }

  /**
   * Calcula todas las estadísticas de triangulares para un jugador
   */
  static calculateTriangularStats(playerTriangulars: PlayerTriangularData[]): TriangularStatsResult {
    return playerTriangulars.reduce((acc, playerTriangular) => {
      // Obtener la posición del equipo en este triangular
      const teamResult = playerTriangular.triangular.teams.find(
        team => team.teamName === playerTriangular.team
      );

      if (teamResult) {
        acc.triangularsPlayed += 1;

        // Contar victorias, empates y derrotas por triangular según posición
        if (teamResult.position === 1) {
          acc.triangularWins += 1;
        } else if (teamResult.position === 2) {
          acc.triangularSeconds += 1;
        } else if (teamResult.position === 3) {
          acc.triangularThirds += 1;
        }

        // Sumar puntos según posición (5 pts por 1°, 2 pts por 2°, 1 pt por 3°)
        if (teamResult.position === 1) {
          acc.triangularPoints += 5;
        } else if (teamResult.position === 2) {
          acc.triangularPoints += 2;
        } else if (teamResult.position === 3) {
          acc.triangularPoints += 1;
        }
        acc.matchesWon += teamResult.wins + teamResult.normalWins;
        acc.matchesDraw += teamResult.draws;
      }

      // Calcular partidos jugados usando la nueva lógica
      const matchesInThisTriangular = this.calculateMatchesPerTriangular(
        playerTriangular.triangular.teams
      );
      acc.matches += matchesInThisTriangular;

      return acc;
    }, {
      matches: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesDraw: 0,
      triangularsPlayed: 0,
      triangularWins: 0,
      triangularSeconds: 0,
      triangularThirds: 0,
      triangularPoints: 0
    });
  }

  /**
   * Calcula estadísticas completas para un jugador
   */

  static calculatePlayerStats(
    player: PrismaPlayer,
    triangularStats: TriangularStatsResult
  ): PlayerStats {
    console.log({
      matches: triangularStats.matches,
      goals: player.goals,
      wins: player.wins,
      draws: player.draws,
      losses: triangularStats.matches - triangularStats.matchesWon - triangularStats.matchesDraw,
      points: player.wins * 3 + player.draws,
      winPercentage: triangularStats.matches > 0
        ? Math.round((player.wins / triangularStats.matches) * 100)
        : 0,
      triangularsPlayed: triangularStats.triangularsPlayed,
      triangularWins: triangularStats.triangularWins,
      triangularSeconds: triangularStats.triangularSeconds,
      triangularThirds: triangularStats.triangularThirds,
      triangularPoints: triangularStats.triangularPoints,
      triangularWinPercentage: triangularStats.triangularsPlayed > 0
        ? Math.round((triangularStats.triangularWins / triangularStats.triangularsPlayed) * 100)
        : 0,
    })

    return {
      matches: triangularStats.matches,
      goals: player.goals,
      wins: player.wins,
      draws: player.draws,
      losses: triangularStats.matches - triangularStats.matchesWon - triangularStats.matchesDraw,
      points: player.wins * 3 + player.draws,
      winPercentage: triangularStats.matches > 0
        ? Math.round((player.wins / triangularStats.matches) * 100)
        : 0,
      triangularsPlayed: triangularStats.triangularsPlayed,
      triangularWins: triangularStats.triangularWins,
      triangularSeconds: triangularStats.triangularSeconds,
      triangularThirds: triangularStats.triangularThirds,
      triangularPoints: triangularStats.triangularPoints,
      triangularWinPercentage: triangularStats.triangularsPlayed > 0
        ? Math.round((triangularStats.triangularWins / triangularStats.triangularsPlayed) * 100)
        : 0,
    };
  }

  /**
   * Procesa un jugador completo con sus triangulares y devuelve el objeto Player
   */
  static processPlayerWithTriangulars(playerData: PrismaPlayer & { triangulars: PlayerTriangularData[] }): Player {
    const triangularStats = this.calculateTriangularStats(playerData.triangulars);

    return {
      id: playerData.id,
      name: playerData.name,
      stats: this.calculatePlayerStats(playerData, triangularStats)
    };
  }

  /**
   * Procesa múltiples jugadores en paralelo
   */
  static processMultiplePlayers(playersData: (PrismaPlayer & { triangulars: PlayerTriangularData[] })[]): Player[] {
    return playersData.map(playerData => this.processPlayerWithTriangulars(playerData));
  }

  /**
   * Calcula promedios por triangular para un jugador
   */
  static calculateTriangularAverages(stats: PlayerStats): TriangularAverages {
    const triangularsPlayed = stats.triangularsPlayed || 0;

    return {
      pointsPerTriangular: triangularsPlayed > 0
        ? Math.round((stats.points / triangularsPlayed) * 100) / 100
        : 0,
      winsPerTriangular: triangularsPlayed > 0
        ? Math.round((stats.wins / triangularsPlayed) * 100) / 100
        : 0,
      goalsPerTriangular: triangularsPlayed > 0
        ? Math.round((stats.goals / triangularsPlayed) * 100) / 100
        : 0,
      matchesPerTriangular: triangularsPlayed > 0
        ? Math.round((stats.matches / triangularsPlayed) * 100) / 100
        : 0,
    };
  }
} 