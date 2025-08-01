import { PlayerTriangularPoints } from "@/store/statsStore";
import { Player } from "@/types";
import { StatMetric, ChartData } from "@/types/stats";
import { ApexOptions } from "apexcharts";

/**
 * Returns a human-readable label for a given statistic metric
 */
export function getMetricLabel(metric: StatMetric): string {
  switch (metric) {
    case 'goals': return 'Goles';
    case 'wins': return 'Victorias';
    default: return '';
  }
}

/**
 * Creates chart data from player statistics
 */
export function prepareChartDataFromPlayers(
  players: Player[],
  metric: StatMetric,
  playersToShow: number,
  highlightedPlayer: string | null
): ChartData {
  if (!players.length) {
    return createEmptyChartData();
  }

  // Sort players by the selected metric
  const sortedPlayers = [...players].sort((a, b) => {
    if (metric === 'goals') {
      return b.stats.goals - a.stats.goals;
    } else if (metric === 'wins') {
      return b.stats.wins - a.stats.wins;
    }
    return 0;
  });

  // Filter players with values greater than 0 for the metric
  const filteredPlayers = sortedPlayers.filter(player => {
    if (metric === 'goals') return player.stats.goals > 0;
    if (metric === 'wins') return player.stats.wins > 0;
    return false;
  });

  if (filteredPlayers.length === 0) {
    return createEmptyChartData();
  }

  // Get top three players for the podium
  const topThree = filteredPlayers.slice(0, 3);
  
  // Limit the number of players according to the state
  const limitedPlayers = filteredPlayers.slice(0, playersToShow);

  const categories = limitedPlayers.map(p => p.name);
  const colors = generateColors(limitedPlayers.map(p => p.name), highlightedPlayer);

  const series = [{
    name: getMetricLabel(metric),
    data: limitedPlayers.map(p => {
      if (metric === 'goals') return p.stats.goals;
      if (metric === 'wins') return p.stats.wins;
      return 0;
    })
  }];

  return {
    categories,
    series,
    colors,
    topThree,
    totalPlayers: filteredPlayers.length,
    chartOptions: createChartOptions(categories, colors, getMetricLabel(metric))
  };
}

/**
 * Creates chart data from triangular points
 */
export function prepareChartDataFromTriangularPoints(
  playerPoints: PlayerTriangularPoints[],
  playersToShow: number,
  highlightedPlayer: string | null
): ChartData {
  if (!playerPoints.length) {
    return createEmptyChartData();
  }

  // Ordenamos los jugadores por puntos totales
  const sortedPlayers = [...playerPoints].sort((a, b) => b.totalPoints - a.totalPoints);
  
  // Filtramos jugadores que han participado en triangulares
  const filteredPlayers = sortedPlayers.filter(player => player.triangularsPlayed > 0);

  if (filteredPlayers.length === 0) {
    return createEmptyChartData();
  }

  // Obtenemos los tres primeros para el podio
  const topThree = filteredPlayers.slice(0, 3).map(p => ({
    id: p.id,
    name: p.name,
    stats: {
      goals: 0, // No relevante para este gráfico
      wins: p.triangularWins,
      matches: p.triangularsPlayed,
      draws: 0, // No relevante para este gráfico
      losses: 0, // No relevante para este gráfico
      points: p.totalPoints
    }
  }));
  
  // Limitamos la cantidad de jugadores según el parámetro
  const limitedPlayers = filteredPlayers.slice(0, Math.min(playersToShow, filteredPlayers.length));

  const categories = limitedPlayers.map(p => p.name);
  const colors = generateColors(categories, highlightedPlayer);

  const series = [{
    name: 'Puntos en Triangulares',
    data: limitedPlayers.map(p => p.totalPoints)
  }];

  return {
    categories,
    series,
    colors,
    topThree,
    totalPlayers: filteredPlayers.length,
    chartOptions: createChartOptions(categories, colors, 'Puntos en Triangulares')
  };
}

/**
 * Creates an empty chart data object
 */
function createEmptyChartData(): ChartData {
  return { 
    categories: [], 
    series: [], 
    colors: [], 
    topThree: [], 
    totalPlayers: 0,
    chartOptions: {}
  };
}

/**
 * Generates colors for chart elements
 */
function generateColors(names: string[], highlightedName: string | null): string[] {
  return names.map((name, index) => 
    highlightedName === name ? '#FF5733' : // Highlighted color
    index === 0 ? '#F59E0B' : // 1st place - gold
    index === 1 ? '#10B981' : // 2nd place - green
    index === 2 ? '#3B82F6' : // 3rd place - blue
    '#9CA3AF'                 // Others - gray
  );
}

/**
 * Creates chart options for ApexCharts
 */
function createChartOptions(
  categories: string[], 
  colors: string[], 
  title: string
): ApexOptions {
  return {
    chart: {
      type: 'bar',
      foreColor: '#fff',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: 20,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    colors,
    tooltip: {
      theme: 'dark'
    },
    legend: {
      show: false
    },
    title: {
      text: title,
      align: 'center',
      style: {
        fontSize: '18px',
        color: '#fff'
      }
    }
  };
} 