"use client";

import { Player } from "@/types";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { PlayerStatsService } from "@/lib/services/playerStats";

// Importar CountUp dinámicamente para evitar problemas de SSR
const CountUp = dynamic(() => import('react-countup'), { ssr: false });

// Importar Chart dinámicamente para evitar problemas de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PlayerStatsChartsProps {
  player: Player;
  allPlayers?: Player[];
}

export function PlayerStatsCharts({ player, allPlayers = [] }: PlayerStatsChartsProps) {
  // Estado para controlar si el componente se ha montado (hidratado)
  const [mounted, setMounted] = useState(false);

  // Estado para el popup de información del rating
  const [showRatingInfo, setShowRatingInfo] = useState(false);

  // Estado para el popup de información del rating V2
  const [showRatingV2Info, setShowRatingV2Info] = useState(false);

  // Efecto para marcar que el componente se ha montado
  useEffect(() => {
    setMounted(true);
  }, []);



  // Calcular estadísticas de rendimiento usando el servicio centralizado
  const performanceData = useMemo(() => {
    return PlayerStatsService.calculatePerformanceData(player.stats);
  }, [player]);

  // Datos para gráfico de torta (resultados)
  const pieChartOptions = {
    chart: {
      type: 'pie' as const,
      background: 'transparent',
    },
    theme: {
      mode: 'dark' as const,
    },
    labels: ['Victorias', 'Empates', 'Derrotas'],
    colors: ['#10B981', '#F59E0B', '#EF4444'],
    legend: {
      position: 'bottom' as const,
    },
    dataLabels: {
      enabled: true,
      formatter: function(val: number) {
        return Math.round(val) + "%";
      }
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val + " partidos";
        }
      }
    }
  };

  const pieChartSeries = [player.stats.wins, player.stats.draws, player.stats.losses];

  // Datos para gráfico de barras (promedios por triangular)
  const barChartOptions = {
    chart: {
      type: 'bar' as const,
      background: 'transparent',
    },
    theme: {
      mode: 'dark' as const,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Puntos/T', 'Victorias/T', 'Goles/T', 'Partidos/T'],
    },
    colors: ['#3B82F6'],
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function(val: number) {
          return val.toFixed(2);
        }
      }
    }
  };

  // Datos para gráfico radial (rating general) usando el servicio centralizado
  const rating = useMemo(() => {
    return PlayerStatsService.calculatePlayerRating(player.stats);
  }, [player]);

  // Datos para el desglose del rating
  const ratingBreakdown = useMemo(() => {
    return PlayerStatsService.calculateRatingBreakdown(player.stats);
  }, [player]);

  // Datos para el rating V2 usando el servicio centralizado
  const ratingV2 = useMemo(() => {
    return PlayerStatsService.calculatePlayerRatingV2(player.stats);
  }, [player]);

  // Datos para el desglose del rating V2
  const ratingV2Breakdown = useMemo(() => {
    return PlayerStatsService.calculateRatingV2Breakdown(player.stats);
  }, [player]);

  // Datos para promedios por triangular
  const triangularAverages = useMemo(() => {
    return PlayerStatsService.calculateTriangularAverages(player.stats);
  }, [player]);

  const barChartSeries = [{
    name: 'Promedio',
    data: [
      triangularAverages?.pointsPerTriangular || 0,
      triangularAverages?.winsPerTriangular || 0,
      triangularAverages?.goalsPerTriangular || 0,
      triangularAverages?.matchesPerTriangular || 0
    ]
  }];





  // Datos para gráfico de comparación por rating usando el servicio centralizado
  const nearbyRatingPlayersData = useMemo(() => {
    if (allPlayers.length <= 1) return { players: [], series: [], categories: [] };

    // Ordenar jugadores por rating usando el servicio centralizado
    const sortedByRating = PlayerStatsService.sortPlayersByMetric(allPlayers, 'rating') || [];
    
    // Encontrar la posición del jugador actual
    const currentPlayerIndex = sortedByRating.findIndex(p => p.id === player.id);
    
    if (currentPlayerIndex === -1) return { players: [], series: [], categories: [] };

    // Seleccionar jugadores cercanos (2 por encima, el actual, 2 por debajo)
    const startIndex = Math.max(0, currentPlayerIndex - 2);
    const endIndex = Math.min(sortedByRating.length - 1, currentPlayerIndex + 2);
    
    const nearbyPlayers = sortedByRating.slice(startIndex, endIndex + 1);
    
    return {
      players: nearbyPlayers,
      categories: nearbyPlayers.map(p => p.name),
      series: [{
        name: 'Rating',
        data: nearbyPlayers.map(p => PlayerStatsService.calculatePlayerRating(p.stats))
      }]
    };
  }, [allPlayers, player]);

  // Datos para gráfico de comparación por rating V2 usando el servicio centralizado
  const nearbyRatingV2PlayersData = useMemo(() => {
    if (allPlayers.length <= 1) return { players: [], series: [], categories: [] };

    // Ordenar jugadores por rating V2 usando el servicio centralizado
    const sortedByRatingV2 = PlayerStatsService.sortPlayersByMetric(allPlayers, 'ratingV2') || [];
    
    // Encontrar la posición del jugador actual
    const currentPlayerIndex = sortedByRatingV2.findIndex(p => p.id === player.id);
    
    if (currentPlayerIndex === -1) return { players: [], series: [], categories: [] };

    // Seleccionar jugadores cercanos (2 por encima, el actual, 2 por debajo)
    const startIndex = Math.max(0, currentPlayerIndex - 2);
    const endIndex = Math.min(sortedByRatingV2.length - 1, currentPlayerIndex + 2);
    
    const nearbyPlayers = sortedByRatingV2.slice(startIndex, endIndex + 1);
    
    return {
      players: nearbyPlayers,
      categories: nearbyPlayers.map(p => p.name),
      series: [{
        name: 'Rating V2',
        data: nearbyPlayers.map(p => PlayerStatsService.calculatePlayerRatingV2(p.stats))
      }]
    };
  }, [allPlayers, player]);

  const nearbyRatingPlayersChartOptions = {
    chart: {
      type: 'bar' as const,
      background: 'transparent',
    },
    theme: {
      mode: 'dark' as const,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        distributed: true, // Diferentes colores para cada barra
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
      formatter: function(val: number) {
        return val.toFixed(1);
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: nearbyRatingPlayersData.categories,
      labels: {
        style: {
          colors: '#fff',
          fontSize: '12px'
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
    colors: nearbyRatingPlayersData.players.map(p => 
      p.id === player.id ? '#10B981' : '#6B7280' // Verde para el jugador actual, gris para los demás
    ),
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number, opts: {dataPointIndex: number}) {
          const playerName = nearbyRatingPlayersData.categories[opts.dataPointIndex];
          return `${playerName}: ${val.toFixed(1)} rating`;
        }
      }
    },
    title: {
      align: 'center' as const,
      style: {
        fontSize: '16px',
        color: '#fff'
      }
    }
  };

  const nearbyRatingV2PlayersChartOptions = {
    chart: {
      type: 'bar' as const,
      background: 'transparent',
    },
    theme: {
      mode: 'dark' as const,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        distributed: true, // Diferentes colores para cada barra
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      },
      formatter: function(val: number) {
        return val.toFixed(1);
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: nearbyRatingV2PlayersData.categories,
      labels: {
        style: {
          colors: '#fff',
          fontSize: '12px'
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
    colors: nearbyRatingV2PlayersData.players.map(p => 
      p.id === player.id ? '#3B82F6' : '#6B7280' // Azul para el jugador actual, gris para los demás
    ),
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number, opts: {dataPointIndex: number}) {
          const playerName = nearbyRatingV2PlayersData.categories[opts.dataPointIndex];
          return `${playerName}: ${val.toFixed(1)} rating V2`;
        }
      }
    },
    title: {
      align: 'center' as const,
      style: {
        fontSize: '16px',
        color: '#fff'
      }
    }
  };

  // Datos para gráfico de comparación con jugadores cercanos usando el servicio centralizado
  const nearbyPlayersData = useMemo(() => {
    if (allPlayers.length <= 1) return { players: [], series: [], categories: [] };

    // Ordenar jugadores por puntos usando el servicio centralizado
    const sortedByPoints = PlayerStatsService.sortPlayersByMetric(allPlayers, 'points') || [];
    
    // Encontrar la posición del jugador actual
    const currentPlayerIndex = sortedByPoints.findIndex(p => p.id === player.id);
    
    if (currentPlayerIndex === -1) return { players: [], series: [], categories: [] };

    // Seleccionar jugadores cercanos (2 por encima, el actual, 2 por debajo)
    const startIndex = Math.max(0, currentPlayerIndex - 2);
    const endIndex = Math.min(sortedByPoints.length - 1, currentPlayerIndex + 2);
    
    const nearbyPlayers = sortedByPoints.slice(startIndex, endIndex + 1);
    
    return {
      players: nearbyPlayers,
      categories: nearbyPlayers.map(p => p.name),
      series: [{
        name: 'Puntos',
        data: nearbyPlayers.map(p => p.stats.points)
      }]
    };
  }, [allPlayers, player]);

  const nearbyPlayersChartOptions = {
    chart: {
      type: 'bar' as const,
      background: 'transparent',
    },
    theme: {
      mode: 'dark' as const,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        distributed: true, // Diferentes colores para cada barra
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: nearbyPlayersData.categories,
      labels: {
        style: {
          colors: '#fff',
          fontSize: '12px'
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
    colors: nearbyPlayersData.players.map(p => 
      p.id === player.id ? '#10B981' : '#6B7280' // Verde para el jugador actual, gris para los demás
    ),
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number, opts: {dataPointIndex: number}) {
          const playerName = nearbyPlayersData.categories[opts.dataPointIndex];
          return `${playerName}: ${val} puntos`;
        }
      }
    },
    title: {
      align: 'center' as const,
      style: {
        fontSize: '16px',
        color: '#fff'
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Estadísticas de {player.name}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Rating General - Solo contador */}
          <div className="bg-gray-800 rounded-lg p-4 relative">

            
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-center flex-1">Rating General</h3>
              <button
                onClick={() => setShowRatingInfo(!showRatingInfo)}
                className="ml-2 w-6 h-6 bg-transparent rounded-full flex items-center justify-center text-white transition-colors"
                title="Ver cómo se calcula el rating"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                    stroke="green" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            
            {/* Popup de información del rating */}
            {showRatingInfo && (
              <div className="absolute top-12 right-4 bg-gray-900 border border-gray-600 rounded-lg p-4 z-10 w-80 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-bold text-green-400">Cálculo del Rating</h4>
                  <button
                    onClick={() => setShowRatingInfo(false)}
                    className="text-gray-400 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="text-gray-300">
                    <strong>Fórmula:</strong> Rating = (Puntos × 0.4) + (% Victorias × 0.35) + (Goles/Partido × 25)
                  </div>
                  
                  <div className="border-t border-gray-700 pt-3">
                    <div className="text-gray-300 mb-2"><strong>Desglose para {player.name}:</strong></div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-purple-400">Puntos: {player.stats.points}</span>
                        <span className="text-gray-300">{player.stats.points} × 0.4 = {ratingBreakdown?.pointsComponent || 0}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-emerald-400">% Victorias: {player.stats.winPercentage || 0}%</span>
                        <span className="text-gray-300">{player.stats.winPercentage || 0} × 0.35 = {ratingBreakdown?.winPercentageComponent || 0}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-yellow-400">Goles/Partido: {PlayerStatsService.calculateGoalsPerMatch(player.stats.goals, player.stats.matches)}</span>
                        <span className="text-gray-300">{PlayerStatsService.calculateGoalsPerMatch(player.stats.goals, player.stats.matches)} × 25 = {ratingBreakdown?.goalsPerMatchComponent || 0}</span>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-green-400">
                          <span>Rating Total:</span>
                          <span>{ratingBreakdown?.totalRating || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-3">
                    * Este es el mismo rating usado para balancear equipos automáticamente
                  </div>
                </div>
              </div>
            )}
            
            {/* Contador grande centrado */}
            <div className="flex items-center justify-center h-48">
              {mounted && rating > 0 && (
                <CountUp
                  key={`rating-${player.id}`}
                  start={0}
                  end={Math.round(rating)}
                  duration={3}
                  enableScrollSpy
                  scrollSpyOnce
                  delay={0}
                >
                  {({ countUpRef }) => (
                    <span 
                      ref={countUpRef} 
                      className="text-center text-green-500 text-6xl font-bold"
                    />
                  )}
                </CountUp>
              )}
              {(!mounted || rating === 0) && (
                <div className="text-center text-green-500 text-6xl font-bold">
                  0
                </div>
              )}
            </div>
          </div>

          {/* Rating V2 - Solo contador */}
          <div className="bg-gray-800 rounded-lg p-4 relative">

            
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-center flex-1">Rating V2</h3>
              <button
                onClick={() => setShowRatingV2Info(!showRatingV2Info)}
                className="ml-2 w-6 h-6 bg-transparent rounded-full flex items-center justify-center text-white transition-colors"
                title="Ver cómo se calcula el rating V2"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                    stroke="blue" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            
            {/* Popup de información del rating V2 */}
            {showRatingV2Info && (
              <div className="absolute top-12 right-4 bg-gray-900 border border-gray-600 rounded-lg p-4 z-10 w-80 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-bold text-blue-400">Cálculo del Rating V2</h4>
                  <button
                    onClick={() => setShowRatingV2Info(false)}
                    className="text-gray-400 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="text-gray-300">
                    <strong>Fórmula:</strong> Rating V2 = (% Triangulares Ganados × 0.6) + (% Victorias × 0.4)
                  </div>
                  
                  <div className="border-t border-gray-700 pt-3">
                    <div className="text-gray-300 mb-2"><strong>Desglose para {player.name}:</strong></div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-yellow-400">% Triangulares Ganados: {player.stats.triangularWinPercentage || 0}%</span>
                        <span className="text-gray-300">{player.stats.triangularWinPercentage || 0} × 0.6 = {ratingV2Breakdown?.triangularWinPercentageComponent || 0}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-emerald-400">% Victorias: {player.stats.winPercentage || 0}%</span>
                        <span className="text-gray-300">{player.stats.winPercentage || 0} × 0.4 = {ratingV2Breakdown?.winPercentageComponent || 0}</span>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between font-bold text-blue-400">
                          <span>Rating V2 Total:</span>
                          <span>{ratingV2Breakdown?.totalRatingV2 || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-3">
                    * Rating V2 se enfoca más en el éxito en triangulares completos
                  </div>
                </div>
              </div>
            )}
            
            {/* Contador grande centrado */}
            <div className="flex items-center justify-center h-48">
              {mounted && ratingV2 > 0 && (
                <CountUp
                  key={`ratingV2-${player.id}`}
                  start={0}
                  end={Math.round(ratingV2)}
                  duration={3}
                  enableScrollSpy
                  scrollSpyOnce
                  delay={0}
                >
                  {({ countUpRef }) => (
                    <span 
                      ref={countUpRef} 
                      className="text-center text-blue-500 text-6xl font-bold"
                    />
                  )}
                </CountUp>
              )}
              {(!mounted || ratingV2 === 0) && (
                <div className="text-center text-blue-500 text-6xl font-bold">
                  0
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de comparación por rating */}
          {nearbyRatingPlayersData.players.length > 1 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Comparación de Rating</h3>
              <Chart
                options={nearbyRatingPlayersChartOptions}
                series={nearbyRatingPlayersData.series}
                type="bar"
                height={300}
              />
            </div>
          )}

          {/* Gráfico de comparación por rating V2 */}
          {nearbyRatingV2PlayersData.players.length > 1 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Comparación de Rating V2</h3>
              <Chart
                options={nearbyRatingV2PlayersChartOptions}
                series={nearbyRatingV2PlayersData.series}
                type="bar"
                height={300}
              />
            </div>
          )}

          {/* Gráfico de torta - Resultados */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Distribución de Resultados</h3>
            <Chart
              options={pieChartOptions}
              series={pieChartSeries}
              type="pie"
              height={300}
            />
          </div>

          {/* Gráfico de barras - Promedios por triangular */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Promedios por triangular</h3>
            <Chart
              options={barChartOptions}
              series={barChartSeries}
              type="bar"
              height={300}
            />
          </div>
        </div>

        {/* Gráfico de comparación con jugadores cercanos por puntos */}
        {nearbyPlayersData.players.length > 1 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Comparación con Jugadores Cercanos (por Puntos)</h3>
            <Chart
              options={nearbyPlayersChartOptions}
              series={nearbyPlayersData.series}
              type="bar"
              height={350}
            />
          </div>
        )}

        {/* Métricas adicionales */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{performanceData?.goalsPerMatch || 0}</div>
            <div className="text-sm text-gray-400">Goles por Partido</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{performanceData?.winPercentage || 0}%</div>
            <div className="text-sm text-gray-400">% de Victorias</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{performanceData?.drawPercentage || 0}%</div>
            <div className="text-sm text-gray-400">% de Empates</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{performanceData?.lossPercentage || 0}%</div>
            <div className="text-sm text-gray-400">% de Derrotas</div>
          </div>
        </div>
      </div>
    </div>
  );
} 