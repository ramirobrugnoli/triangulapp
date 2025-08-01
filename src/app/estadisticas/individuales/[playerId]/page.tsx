"use client";

import { useEffect, useState } from "react";
import { useStatsStore } from "@/store/statsStore";
import { useSeasonStore } from "@/store/seasonStore";
import { useRouter, useParams } from "next/navigation";
import { PlayerStatsCharts } from "@/components/stats/PlayerStatsCharts";
import { PlayerSelector as StatsPlayerSelector } from "@/components/stats/StatsPlayerSelector";
import { PlayerTriangularHistory } from "@/components/stats/PlayerTriangularHistory";
import { SeasonSelector } from "@/components/season/SeasonSelector";
import { Player } from "@/types";
import { api } from "@/lib/api";

const EstadisticasIndividualesPage = () => {
  const router = useRouter();
  const params = useParams();
  const playerIdFromUrl = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const { players, loading, error, fetchStats } = useStatsStore();
  const { getSelectedSeasonId, isAllSeasonsMode } = useSeasonStore();
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
      const seasonId = getSelectedSeasonId();
      const allSeasons = isAllSeasonsMode();
      const statsData = await api.players.getPlayerStatsByIds(playerIds, seasonId, allSeasons);
      setPlayersWithStats(statsData);
    } catch (error) {
      console.error("Error al cargar estadísticas completas:", error);
      // Si falla, usar los datos básicos
      setPlayersWithStats(playerList);
    }
  };

  useEffect(() => {
    const seasonId = getSelectedSeasonId();
    const allSeasons = isAllSeasonsMode();
    fetchStats(seasonId, allSeasons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      loadPlayersWithCompleteStats(players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  useEffect(() => {
    if (playersWithStats.length > 0 && mounted) {
      if (playerIdFromUrl) {
        const found = playersWithStats.find(p => p.id === playerIdFromUrl);
        if (found) setSelectedPlayer(found);
        else setSelectedPlayer(playersWithStats[0]);
      } else if (!selectedPlayer) {
        setSelectedPlayer(playersWithStats[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playersWithStats, playerIdFromUrl, mounted]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    router.replace(`/estadisticas/individuales/${player.id}`);
  };

  const handleSeasonChange = (seasonId: string | null, allSeasons: boolean) => {
    fetchStats(seasonId || undefined, allSeasons);
  };

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

      {/* Season Selector */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <SeasonSelector onSeasonChange={handleSeasonChange} className="max-w-md" />
      </div>

      {/* Selector de jugador */}
      <StatsPlayerSelector 
        players={playersWithStats}
        selectedPlayer={selectedPlayer}
        onPlayerSelect={handlePlayerSelect}
        loading={loading}
      />

      {/* Gráficos de estadísticas del jugador seleccionado */}
      {selectedPlayer && (
        <PlayerStatsCharts 
          player={selectedPlayer}
          allPlayers={playersWithStats}
        />
      )}

      {/* Historial de triangulares del jugador seleccionado */}
      {selectedPlayer && (
        <PlayerTriangularHistory 
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
        />
      )}
    </div>
  );
} 

export default EstadisticasIndividualesPage;