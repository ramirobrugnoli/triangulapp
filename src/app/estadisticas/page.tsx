"use client";

import { useEffect } from "react";
import { PointsTable } from "@/components/stats/PointsTable";
import { TriangularPointsTable } from "@/components/stats/TriangularPointsTable";
import { useStatsStore } from "@/store/statsStore";
import { useRouter } from "next/navigation";
import { SeasonSelector } from "@/components/season/SeasonSelector";
import { useSeasonStore } from "@/store/seasonStore";

export default function EstadisticasPage() {
  const router = useRouter();
  const { players, triangularHistory, loading, error, fetchStats } = useStatsStore();
  const { getSelectedSeasonId, isAllSeasonsMode } = useSeasonStore();

  useEffect(() => {
    const seasonId = getSelectedSeasonId();
    const allSeasons = isAllSeasonsMode();
    fetchStats(seasonId, allSeasons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <button className="bg-transparent text-white px-4 py-2 rounded-md " onClick={() => router.push("/estadisticas/individuales")}>
          Estadisticas individuales →
        </button>
      </div>

      {/* Season Selector */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <SeasonSelector onSeasonChange={handleSeasonChange} className="max-w-md" />
      </div>

      {/* Tabla de puntos por triangulares */}
      <TriangularPointsTable
        players={players}
        triangularHistory={triangularHistory}
      />

      {/* Tabla de puntos por partidos */}
      <PointsTable players={players} />
    </div>
  );
}
