"use client";

import { useState, useEffect } from "react";
import { PointsTable } from "@/components/stats/PointsTable";
import { TriangularPointsTable } from "@/components/stats/TriangularPointsTable";
import { api } from "@/lib/api";
import { Player, TriangularHistory } from "@/types";

export default function EstadisticasPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [triangularHistory, setTriangularHistory] = useState<
    TriangularHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar jugadores y triangulares en paralelo
        const [playersData, historyData] = await Promise.all([
          api.players.getAllPlayers(),
          api.triangular.getTriangularHistory(),
        ]);

        setPlayers(playersData);
        setTriangularHistory(historyData);
      } catch (error) {
        console.error("Error cargando los datos:", error);
        setError("Error al cargar los datos. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
