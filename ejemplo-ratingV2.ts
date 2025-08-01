// Ejemplo de uso del nuevo sistema RatingV2
import { PlayerStatsService } from './src/lib/services/playerStats';
import { PlayerStats } from './src/types';

// Ejemplo de jugador con buen rendimiento en partidos individuales y triangulares
const jugadorExcelente: PlayerStats = {
  matches: 20,
  goals: 15,
  wins: 16,
  draws: 2,
  losses: 2,
  points: 50,
  winPercentage: 80,        // 80% de victorias en partidos
  triangularsPlayed: 5,
  triangularWins: 4,
  triangularSeconds: 1,
  triangularThirds: 0,
  triangularPoints: 17,
  triangularWinPercentage: 80, // 80% de triangulares ganados
};

// Ejemplo de jugador con buen rendimiento en partidos pero bajo en triangulares
const jugadorInconsistente: PlayerStats = {
  matches: 15,
  goals: 12,
  wins: 10,
  draws: 3,
  losses: 2,
  points: 33,
  winPercentage: 67,        // 67% de victorias en partidos
  triangularsPlayed: 4,
  triangularWins: 0,
  triangularSeconds: 2,
  triangularThirds: 2,
  triangularPoints: 4,
  triangularWinPercentage: 0, // 0% de triangulares ganados
};

console.log("=== COMPARACIÓN DE RATINGS ===\n");

console.log("🏆 Jugador Excelente:");
console.log(`Rating V1: ${PlayerStatsService.calculatePlayerRating(jugadorExcelente)}`);
console.log(`Rating V2: ${PlayerStatsService.calculatePlayerRatingV2(jugadorExcelente)}`);

const breakdown1 = PlayerStatsService.calculateRatingV2Breakdown(jugadorExcelente);
console.log("Desglose V2:");
console.log(`  - Victorias (60%): ${breakdown1.winPercentageComponent}`);
console.log(`  - Triangulares (40%): ${breakdown1.triangularWinPercentageComponent}`);
console.log(`  - Total: ${breakdown1.totalRatingV2}\n`);

console.log("⚠️  Jugador Inconsistente:");
console.log(`Rating V1: ${PlayerStatsService.calculatePlayerRating(jugadorInconsistente)}`);
console.log(`Rating V2: ${PlayerStatsService.calculatePlayerRatingV2(jugadorInconsistente)}`);

const breakdown2 = PlayerStatsService.calculateRatingV2Breakdown(jugadorInconsistente);
console.log("Desglose V2:");
console.log(`  - Victorias (60%): ${breakdown2.winPercentageComponent}`);
console.log(`  - Triangulares (40%): ${breakdown2.triangularWinPercentageComponent}`);
console.log(`  - Total: ${breakdown2.totalRatingV2}\n`);

console.log("=== ANÁLISIS ===");
console.log("El Rating V2 penaliza más a jugadores que no ganan triangulares,");
console.log("priorizando la consistencia en torneos completos sobre victorias individuales.");