import { Player, TriangularHistory } from "@/types";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

type PlayerTriangularPoints = {
  id: string;
  name: string;
  triangularWins: number; // primer lugar (5 pts)
  triangularSeconds: number; // segundo lugar (2 pts)
  triangularThirds: number; // tercer lugar (1 pt)
  totalPoints: number; // total calculado
  triangularsPlayed: number; // total de triangulares jugados
};

interface TriangularPointsTableProps {
  players: Player[];
  triangularHistory: TriangularHistory[];
}

export function TriangularPointsTable({
  players,
  triangularHistory,
}: TriangularPointsTableProps) {
  const router = useRouter();
  // Usamos useMemo para calcular los puntos solo cuando cambian los datos de entrada
  const playerPoints = useMemo(() => {
    // Mapeamos jugadores a su estructura de puntos
    const playerPointsMap: Record<string, PlayerTriangularPoints> = {};

    players.forEach((player) => {
      playerPointsMap[player.id] = {
        id: player.id,
        name: player.name,
        triangularWins: 0,
        triangularSeconds: 0,
        triangularThirds: 0,
        totalPoints: 0,
        triangularsPlayed: 0,
      };
    });

    // Procesar el historial de triangulares para calcular los puntos de cada jugador
    triangularHistory.forEach((triangular) => {
      // Identificamos los equipos por posición
      const firstTeam = triangular.teams.find((team) => team.position === 1);
      const secondTeam = triangular.teams.find((team) => team.position === 2);
      const thirdTeam = triangular.teams.find((team) => team.position === 3);

      // Para cada jugador, verificamos si participó en este triangular
      players.forEach((player) => {
        const playerPointsEntry = playerPointsMap[player.id];

        // Verificamos en qué equipo jugó el jugador en este triangular
        let playerTeam = null;

        // Buscamos si el jugador aparece entre los goleadores
        const scorerEntry = triangular.scorers.find(
          (scorer) => scorer.name === player.name
        );
        if (scorerEntry) {
          playerTeam = scorerEntry.team;
        } else {
          // Si no anotó goles, no podemos determinar si participó
          return;
        }

        // Asignamos puntos según el equipo en el que jugó
        if (playerTeam === firstTeam?.name) {
          playerPointsEntry.triangularWins += 1;
          playerPointsEntry.totalPoints += 5;
          playerPointsEntry.triangularsPlayed += 1;
        } else if (playerTeam === secondTeam?.name) {
          playerPointsEntry.triangularSeconds += 1;
          playerPointsEntry.totalPoints += 2;
          playerPointsEntry.triangularsPlayed += 1;
        } else if (playerTeam === thirdTeam?.name) {
          playerPointsEntry.triangularThirds += 1;
          playerPointsEntry.totalPoints += 1;
          playerPointsEntry.triangularsPlayed += 1;
        }
      });
    });

    // Convertir el mapa a un arreglo y ordenar por puntos totales
    return Object.values(playerPointsMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .filter((player) => player.triangularsPlayed > 0); // Solo mostrar jugadores que han participado
  }, [players, triangularHistory]);

  // Si no hay datos de triangulares, mostramos un mensaje
  if (triangularHistory.length === 0) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">
          Tabla de Puntos por Triangular
        </h2>
        <p className="text-gray-400 text-center py-8">
          No hay datos de triangulares disponibles
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Tabla de Puntos por Triangular</h2>
      <div className="h-[366px] overflow-y-auto">
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jugador
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  1°
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  2°
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  3°
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  TJ
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider font-bold">
                  PTS
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {playerPoints.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                playerPoints.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-800">
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                      <button
                        className="text-green-400 hover:underline focus:outline-none"
                        onClick={() => router.push(`/estadisticas/individuales/${player.id}`)}
                      >
                        {player.name}
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {player.triangularWins}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {player.triangularSeconds}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {player.triangularThirds}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {player.triangularsPlayed}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                      {player.totalPoints}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
