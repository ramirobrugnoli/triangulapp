"use client";

interface TeamScore {
  name: string;
  points: number;
  wins: number;  // victorias por 2 goles
  normalWins: number;  // victorias por 1 gol
  draws: number;
}

interface DailyScoreTableProps {
  scores: TeamScore[];
}

export function DailyScoreTable({ scores }: DailyScoreTableProps) {
  const sortedScores = [...scores].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
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
          {sortedScores.map((team) => (
            <tr key={team.name} className="border-t border-gray-800">
              <td className="px-4 py-2">{team.name}</td>
              <td className="px-4 py-2 text-center">
                {team.wins + team.normalWins + team.draws}
              </td>
              <td className="px-4 py-2 text-center">{team.wins}</td>
              <td className="px-4 py-2 text-center">{team.normalWins}</td>
              <td className="px-4 py-2 text-center">{team.draws}</td>
              <td className="px-4 py-2 text-center font-bold">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}