"use client";

import { StatMetric, ChartData } from "@/types/stats";
import { StatisticsChart } from "@/app/graficos/components/StatisticsChart";
import { PodiumDisplay } from "@/app/graficos/components/PodiumDisplay";
import { PlayersCountSelector } from "@/app/graficos/components/PlayersCountSelector";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useStatsStore } from "@/store/statsStore";
import { useEffect } from "react";
import { prepareChartDataFromPlayers, prepareChartDataFromTriangularPoints } from "@/app/graficos/utils/chartUtils";

export default function GraficosPage() {
  const { 
    loading, 
    error, 
    players,
    highlightedPlayers, 
    playersToShow,
    triangularHistory,
    fetchStats,
    handlePlayerHighlight,
    handlePlayersToShowChange
  } = useStatsStore();

  const playerPoints = useStatsStore(state => state.triangularPointsTable);
  const calculateTriangularPointsTable = useStatsStore(state => state.calculateTriangularPointsTable);

  useEffect(() => {
    calculateTriangularPointsTable();
  }, [players, triangularHistory, calculateTriangularPointsTable]);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Preparamos los datos para cada gráfico
  const triangularPointsData = prepareChartDataFromTriangularPoints(playerPoints, playersToShow.triangularPoints, highlightedPlayers.triangularPoints);
  const goalsData = prepareChartDataFromPlayers(players, 'goals', playersToShow.goals, highlightedPlayers.goals);
  const winsData = prepareChartDataFromPlayers(players, 'wins', playersToShow.wins, highlightedPlayers.wins);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gráficos de Estadísticas</h1>

      <StatisticsSection 
        title="Ranking de Puntos en Triangulares"
        metric="triangularPoints"
        data={triangularPointsData}
        highlightedPlayer={highlightedPlayers.triangularPoints}
        playersToShow={playersToShow.triangularPoints}
        onPlayerHighlight={handlePlayerHighlight}
        onPlayersToShowChange={handlePlayersToShowChange}
      />
      
      <StatisticsSection 
        title="Ranking de Goleadores"
        metric="goals"
        data={goalsData}
        highlightedPlayer={highlightedPlayers.goals}
        playersToShow={playersToShow.goals}
        onPlayerHighlight={handlePlayerHighlight}
        onPlayersToShowChange={handlePlayersToShowChange}
      />

      <StatisticsSection 
        title="Ranking de Victorias"
        metric="wins"
        data={winsData}
        highlightedPlayer={highlightedPlayers.wins}
        playersToShow={playersToShow.wins}
        onPlayerHighlight={handlePlayerHighlight}
        onPlayersToShowChange={handlePlayersToShowChange}
      />
    </div>
  );
}

interface StatisticsSectionProps {
  title: string;
  metric: StatMetric;
  data: ChartData;
  highlightedPlayer: string | null;
  playersToShow: number;
  onPlayerHighlight: (metric: StatMetric, playerName: string) => void;
  onPlayersToShowChange: (metric: StatMetric, value: number) => void;
}

function StatisticsSection({
  title,
  metric,
  data,
  playersToShow,
  onPlayerHighlight,
  onPlayersToShowChange
}: StatisticsSectionProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {data.categories.length > 0 && (
          <PlayersCountSelector 
            metric={metric} 
            totalPlayers={data.totalPlayers} 
            currentValue={playersToShow}
            onChange={onPlayersToShowChange}
          />
        )}
      </div>
      {data.categories.length > 0 ? (
        <>
          <PodiumDisplay 
            topThree={data.topThree} 
            metric={metric} 
            onPlayerSelect={onPlayerHighlight}
          />
          <div className="h-[400px]">
            <StatisticsChart 
              options={data.chartOptions}
              series={data.series}
              type="bar"
            />
          </div>
        </>
      ) : (
        <p className="text-gray-400 text-center py-8">
          No hay datos disponibles
        </p>
      )}
    </div>
  );
}
