"use client";

import { useEffect } from "react";
import { PointsTable } from "@/components/stats/PointsTable";
import { TriangularPointsTable } from "@/components/stats/TriangularPointsTable";
import { useStatsStore } from "@/store/statsStore";

export default function EstadisticasPage() {
  const { players, triangularHistory, loading, error, fetchStats } = useStatsStore();

  useEffect(() => {
      fetchStats();
  }, []);

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
      <h1 className="text-2xl font-bold">Estadísticas</h1>

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
