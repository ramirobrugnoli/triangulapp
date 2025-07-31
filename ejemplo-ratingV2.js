// Ejemplo simplificado del RatingV2
console.log("=== SISTEMA DE RATING V2 ===\n");

// Función del nuevo rating V2
function calculateRatingV2(winPercentage, triangularWinPercentage) {
  return Math.round(((winPercentage * 0.6) + (triangularWinPercentage * 0.4)) * 100) / 100;
}

// Función de desglose
function calculateRatingV2Breakdown(winPercentage, triangularWinPercentage) {
  const winComponent = Math.round(winPercentage * 0.6 * 100) / 100;
  const triangularComponent = Math.round(triangularWinPercentage * 0.4 * 100) / 100;
  const total = winComponent + triangularComponent;
  
  return {
    winPercentageComponent: winComponent,
    triangularWinPercentageComponent: triangularComponent,
    totalRatingV2: Math.round(total * 100) / 100
  };
}

// Ejemplos de jugadores
const jugadores = [
  {
    nombre: "🏆 Jugador Excelente",
    winPercentage: 80,
    triangularWinPercentage: 80,
    descripcion: "Gana tanto partidos como triangulares"
  },
  {
    nombre: "⚽ Jugador de Partidos", 
    winPercentage: 90,
    triangularWinPercentage: 20,
    descripcion: "Excelente en partidos individuales, flojo en triangulares"
  },
  {
    nombre: "🏅 Jugador de Torneos",
    winPercentage: 60,
    triangularWinPercentage: 90,
    descripcion: "Rinde mejor en triangulares completos"
  },
  {
    nombre: "⚠️  Jugador Inconsistente",
    winPercentage: 67,
    triangularWinPercentage: 0,
    descripcion: "Buen rendimiento individual, nunca gana triangulares"
  }
];

jugadores.forEach(jugador => {
  console.log(`${jugador.nombre}`);
  console.log(`${jugador.descripcion}`);
  
  const ratingV2 = calculateRatingV2(jugador.winPercentage, jugador.triangularWinPercentage);
  const breakdown = calculateRatingV2Breakdown(jugador.winPercentage, jugador.triangularWinPercentage);
  
  console.log(`Rating V2: ${ratingV2}`);
  console.log(`Desglose:`);
  console.log(`  - % Victorias (60%): ${jugador.winPercentage}% → ${breakdown.winPercentageComponent}`);
  console.log(`  - % Triangulares (40%): ${jugador.triangularWinPercentage}% → ${breakdown.triangularWinPercentageComponent}`);
  console.log(`  - Total: ${breakdown.totalRatingV2}\n`);
});

console.log("=== FÓRMULA RATING V2 ===");
console.log("Rating V2 = (% Victorias × 0.6) + (% Triangulares Ganados × 0.4)");
console.log("\n🎯 Ventajas del Rating V2:");
console.log("• Más simple que el Rating V1");
console.log("• Enfoca en resultados finales (victorias y campeonatos)");
console.log("• Penaliza jugadores que solo ganan partidos pero no triangulares");
console.log("• Escala de 0-100 más intuitiva");