// src/app/historial/page.tsx
"use client";

import { useEffect, useState } from "react";
import { TriangularHistory } from "@/types";
import { api } from "@/lib/api";
import { getColorByTeam } from "@/lib/helpers/helpers";

export default function HistorialPage() {
  const [triangularHistory, setTriangularHistory] = useState<
    TriangularHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTriangularIndex, setCurrentTriangularIndex] = useState(0);

  useEffect(() => {
    const fetchTriangularHistory = async () => {
      try {
        setLoading(true);
        const history = await api.triangular.getTriangularHistory();
        setTriangularHistory(history);
        setError(null);
      } catch (err) {
        console.error("Error fetching triangular history:", err);
        setError("Error al cargar el historial de triangulares");
      } finally {
        setLoading(false);
      }
    };

    fetchTriangularHistory();
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

  if (triangularHistory.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Historial de Triangulares</h1>
        <div className="bg-gray-900 p-6 rounded-lg text-center">
          <p className="text-gray-400">No hay triangulares registrados</p>
        </div>
      </div>
    );
  }

  const currentTriangular = triangularHistory[currentTriangularIndex];

  // Ordenar equipos por posición
  const sortedTeams = [...currentTriangular.teams].sort(
    (a, b) => a.position - b.position
  );

  // Ordenar goleadores por cantidad de goles
  const sortedScorers = [...currentTriangular.scorers].sort(
    (a, b) => b.goals - a.goals
  );

  // Formatear fecha
  const formattedDate = new Date(currentTriangular.date).toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const handlePrevious = () => {
    setCurrentTriangularIndex((prev) =>
      prev > 0 ? prev - 1 : triangularHistory.length - 1
    );
  };

  const handleNext = () => {
    setCurrentTriangularIndex((prev) =>
      prev < triangularHistory.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial de Triangulares</h1>

      {/* Navegación entre triangulares */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
        >
          ← Anterior
        </button>
        <span className="text-gray-300">
          {currentTriangularIndex + 1} / {triangularHistory.length}
        </span>
        <button
          onClick={handleNext}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
        >
          Siguiente →
        </button>
      </div>

      {/* Detalles del triangular */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-green-500 mb-1">
            Triangular #{currentTriangular.id.substring(0, 8)}
          </h2>
          <p className="text-gray-400">{formattedDate}</p>
        </div>

        {/* Podio de equipos */}
        <div className="flex justify-center items-end space-x-4 mb-8">
          {/* Segundo lugar */}
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold">
              {getColorByTeam(sortedTeams[1].name)}
            </div>
            <div className="bg-green-500 w-24 h-24 flex flex-col items-center justify-center rounded-t-lg">
              <span className="text-2xl font-bold">
                {sortedTeams[1].points}
              </span>
              <span className="text-sm">puntos</span>
            </div>
            <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
              <span className="text-xl">2°</span>
            </div>
          </div>

          {/* Primer lugar */}
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold">
              {getColorByTeam(sortedTeams[0].name)}
            </div>
            <div className="bg-yellow-500 w-24 h-32 flex flex-col items-center justify-center rounded-t-lg">
              <span className="text-2xl font-bold">
                {sortedTeams[0].points}
              </span>
              <span className="text-sm">puntos</span>
            </div>
            <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
              <span className="text-xl">1°</span>
            </div>
          </div>

          {/* Tercer lugar */}
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold">
              {getColorByTeam(sortedTeams[2].name)}
            </div>
            <div className="bg-blue-500 w-24 h-16 flex flex-col items-center justify-center rounded-t-lg">
              <span className="text-2xl font-bold">
                {sortedTeams[2].points}
              </span>
              <span className="text-sm">puntos</span>
            </div>
            <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
              <span className="text-xl">3°</span>
            </div>
          </div>
        </div>

        {/* Tabla de posiciones */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Tabla de Posiciones</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Equipo</th>
                  <th className="px-4 py-2 text-center">PJ</th>
                  <th className="px-4 py-2 text-center">V2</th>
                  <th className="px-4 py-2 text-center">V1</th>
                  <th className="px-4 py-2 text-center">E</th>
                  <th className="px-4 py-2 text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team) => (
                  <tr key={team.name} className="border-t border-gray-800">
                    <td className="px-4 py-2">{getColorByTeam(team.name)}</td>
                    <td className="px-4 py-2 text-center">
                      {team.wins + team.normalWins + team.draws}
                    </td>
                    <td className="px-4 py-2 text-center">{team.wins}</td>
                    <td className="px-4 py-2 text-center">{team.normalWins}</td>
                    <td className="px-4 py-2 text-center">{team.draws}</td>
                    <td className="px-4 py-2 text-center font-bold">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de goleadores */}
        <div>
          <h3 className="text-lg font-bold mb-2">Goleadores</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Jugador</th>
                  <th className="px-4 py-2 text-center">Equipo</th>
                  <th className="px-4 py-2 text-center">Goles</th>
                </tr>
              </thead>
              <tbody>
                {sortedScorers.length > 0 ? (
                  sortedScorers.map((scorer, index) => (
                    <tr key={index} className="border-t border-gray-800">
                      <td className="px-4 py-2">{scorer.name}</td>
                      <td className="px-4 py-2 text-center">
                        {getColorByTeam(scorer.team)}
                      </td>
                      <td className="px-4 py-2 text-center font-bold">
                        {scorer.goals}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-2 text-center text-gray-400"
                    >
                      No hay goleadores registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
