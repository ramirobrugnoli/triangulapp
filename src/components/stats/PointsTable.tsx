"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export function PointsTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await api.players.getAllPlayers();
        console.log("data del fetch:", data);
        setPlayers(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  console.log("players:", players);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const sortedByPoints = [...players].sort(
    (a, b) => b.stats.points - a.stats.points
  );

  const sortedByGoals = [...players].sort(
    (a, b) => b.stats.goals - a.stats.goals
  );

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold mb-4">Tabla de Puntos</h2>
      <div className="h-[366px] overflow-y-auto">
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  PJ
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  G
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  E
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  P
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {sortedByPoints.map((player) => (
                <tr key={player.id} className="hover:bg-gray-800">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                    {player.name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.matches}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.wins}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.draws}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.losses}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Tabla de Goleadores</h2>
      <div className="h-[366px] overflow-y-auto">
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Goles
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {sortedByGoals.map((player) => (
                <tr key={player.id} className="hover:bg-gray-800">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                    {player.name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.stats.goals}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                    {(player.stats.goals / (player.stats.matches || 1)).toFixed(
                      2
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
