"use client";

import { useEffect, useState } from "react";
import { useStatsStore } from "@/store/statsStore";
import { useRouter } from "next/navigation";
import { PlayerStatsCharts } from "@/components/stats/PlayerStatsCharts";
import { PlayerSelector as StatsPlayerSelector } from "@/components/stats/StatsPlayerSelector";
import { Player } from "@/types";
import { api } from "@/lib/api";

export default function EstadisticasIndividualesPage() {
  const router = useRouter();
  const { players, loading, error, fetchStats } = useStatsStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playersWithStats, setPlayersWithStats] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);

  // Efecto para marcar que el componente se ha montado
  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para cargar estadísticas completas con winPercentage
  const loadPlayersWithCompleteStats = async (playerList: Player[]) => {
    if (playerList.length === 0) return;
    
    try {
      const playerIds = playerList.map(player => player.id);
      const statsData = await api.players.getPlayerStatsByIds(playerIds);
      setPlayersWithStats(statsData);
    } catch (error) {
      console.error("Error al cargar estadísticas completas:", error);
      // Si falla, usar los datos básicos
      setPlayersWithStats(playerList);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      loadPlayersWithCompleteStats(players);
    }
  }, [players]);

  useEffect(() => {
    if (playersWithStats.length > 0 && !selectedPlayer && mounted) {
      // Seleccionar automáticamente un jugador al azar solo después de montar
      const randomIndex = Math.floor(Math.random() * playersWithStats.length);
      setSelectedPlayer(playersWithStats[randomIndex]);
    }
  }, [playersWithStats, selectedPlayer, mounted]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900 text-red-200 rounded-lg">{error}</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Estadísticas Individuales</h1>
        <button 
          className="bg-transparent text-white px-4 py-2 rounded-md hover:bg-gray-600"
          onClick={() => router.push("/estadisticas")}
        >
          ← Volver a Estadísticas
        </button>
      </div>

      {/* Selector de jugador */}
      <StatsPlayerSelector 
        players={playersWithStats}
        selectedPlayer={selectedPlayer}
        onPlayerSelect={setSelectedPlayer}
      />

      {/* Gráficos de estadísticas del jugador seleccionado */}
      {selectedPlayer && (
        <PlayerStatsCharts 
          player={selectedPlayer}
          allPlayers={playersWithStats}
        />
      )}
    </div>
  );
} 