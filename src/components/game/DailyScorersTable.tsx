import { useGameStore } from "@/store/gameStore";

export function DailyScorersTable() {
  const { currentGoals, activeTeams } = useGameStore();

  const scorers = Object.entries(currentGoals)
    .map(([playerId, goals]) => {
      const player = [
        ...activeTeams.teamA.members,
        ...activeTeams.teamB.members,
        ...activeTeams.waiting.members,
      ].find((member) => member.id === playerId);

      return {
        id: playerId,
        name: player?.name || "Jugador Desconocido",
        goals,
      };
    })
    .sort((a, b) => b.goals - a.goals);

  if (scorers.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No hay goles registrados
      </div>
    );
  }

  return (
    <div className="h-[320px] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Jugador
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Goles
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {scorers.map((scorer) => (
            <tr key={scorer.id} className="hover:bg-gray-800">
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                {scorer.name}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                {scorer.goals}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
