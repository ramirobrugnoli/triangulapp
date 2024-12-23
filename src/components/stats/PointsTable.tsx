"use client";

import { Player } from "@/types";
import { useEffect, useState } from "react";
import { playerService } from "@/lib/api";

export function PointsTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerService.getAllPlayers();
        setPlayers(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.stats.points - a.stats.points);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Jugador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              PJ
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              G
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              E
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              P
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {sortedPlayers.map((player) => (
            <tr key={player.id} className="hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                {player.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {player.stats.matches}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {player.stats.wins}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {player.stats.draws}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {player.stats.losses}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {player.stats.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}