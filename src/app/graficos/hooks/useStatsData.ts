import { useState, useEffect } from "react";
import { Player } from "@/types";
import { api } from "@/lib/api";
import { StatMetric, ChartData } from "@/types/stats";
import { ApexOptions } from "apexcharts";
import { mockPlayers } from "../../../store/mocks/stats";

export function useStatsData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedPlayers, setHighlightedPlayers] = useState<{
    goals: string | null;
    wins: string | null;
  }>({
    goals: null,
    wins: null,
  });
  const [playersToShow, setPlayersToShow] = useState<{
    goals: number;
    wins: number;
  }>({
    goals: 15,
    wins: 15,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Add mock data for development environment
        if (process.env.NODE_ENV === 'development') {
          
          console.log('Using mock data in development mode');
          setPlayers(mockPlayers);
          setLoading(false);
          return;
        }
        
        const playersData = await api.players.getAllPlayers();
        setPlayers(playersData);
      } catch (error) {
        console.error("Error cargando los datos:", error);
        setError("Error al cargar los datos. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlayerHighlight = (metric: StatMetric, playerName: string) => {
    setHighlightedPlayers(prev => ({
      ...prev,
      [metric]: prev[metric as keyof typeof prev] === playerName ? null : playerName,
    }));
  };

  const handlePlayersToShowChange = (metric: StatMetric, value: number) => {
    setPlayersToShow(prev => ({
      ...prev,
      [metric]: value
    }));
  };

  const getMetricLabel = (metric: StatMetric) => {
    switch (metric) {
      case 'goals': return 'Goles';
      case 'wins': return 'Victorias';
      default: return '';
    }
  };

  const prepareChartData = (metric: StatMetric): ChartData => {
    if (!players.length) return { 
      categories: [], 
      series: [], 
      colors: [], 
      topThree: [], 
      totalPlayers: 0,
      chartOptions: {}
    };

    // Ordenamos los jugadores por la métrica seleccionada
    const sortedPlayers = [...players].sort((a, b) => {
      if (metric === 'goals') {
        return b.stats.goals - a.stats.goals;
      } else if (metric === 'wins') {
        return b.stats.wins - a.stats.wins;
      }
      return 0;
    });

    // Tomamos solo los jugadores con valores mayores a 0 en la métrica
    const filteredPlayers = sortedPlayers.filter(player => {
      if (metric === 'goals') return player.stats.goals > 0;
      if (metric === 'wins') return player.stats.wins > 0;
      return false;
    });

    // Si no hay jugadores con valores, retornamos datos vacíos
    if (filteredPlayers.length === 0) {
      return { 
        categories: [], 
        series: [], 
        colors: [], 
        topThree: [], 
        totalPlayers: 0,
        chartOptions: {}
      };
    }

    // Obtenemos los tres primeros para el podio
    const topThree = filteredPlayers.slice(0, 3);
    
    // Limitamos la cantidad de jugadores según el estado
    const limitedPlayers = filteredPlayers.slice(0, playersToShow[metric as keyof typeof playersToShow]);

    const categories = limitedPlayers.map(p => p.name);
    const colors = limitedPlayers.map((p, index) => 
      highlightedPlayers[metric as keyof typeof highlightedPlayers] === p.name ? '#FF5733' : // Color destacado si está seleccionado
      index === 0 ? '#F59E0B' : // 1º lugar - dorado
      index === 1 ? '#10B981' : // 2º lugar - verde
      index === 2 ? '#3B82F6' : // 3º lugar - azul
      '#9CA3AF'                 // resto - gris
    );

    const series = [{
      name: getMetricLabel(metric),
      data: limitedPlayers.map(p => {
        if (metric === 'goals') return p.stats.goals;
        if (metric === 'wins') return p.stats.wins;
        return 0;
      })
    }];

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar' as const,
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
        text: getMetricLabel(metric),
        align: 'center',
        style: {
          fontSize: '18px',
          color: '#fff'
        }
      }
    };

    return {
      categories,
      series,
      colors,
      topThree,
      totalPlayers: filteredPlayers.length,
      chartOptions
    };
  };

  return {
    players,
    loading,
    error,
    highlightedPlayers,
    playersToShow,
    handlePlayerHighlight,
    handlePlayersToShowChange,
    prepareChartData
  };
} 