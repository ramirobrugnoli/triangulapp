import { Player } from "@/types";
import { useMemo } from "react";

interface PointsTableProps {
  players: Player[];
}

export function PointsTable({ players }: PointsTableProps) {
  // Usamos useMemo para ordenar los jugadores solo cuando cambian los datos
  const sortedByPoints = useMemo(() => {
    return [...players].sort((a, b) => {
      const aPoints = a.stats.wins * 3 + a.stats.draws;
      const bPoints = b.stats.wins * 3 + b.stats.draws;
      return bPoints - aPoints;
    });
  }, [players]);

  const sortedByGoals = useMemo(() => {
    return [...players].sort((a, b) => b.stats.goals - a.stats.goals);
  }, [players]);

  if (players.length === 0) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Tabla de Puntos</h2>
        <p className="text-gray-400 text-center py-8">
          No hay datos de jugadores disponibles
        </p>
      </div>
    );
  }

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
                  TJ
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  PG
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  PE
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
                    {player.stats.wins * 3 + player.stats.draws}
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
