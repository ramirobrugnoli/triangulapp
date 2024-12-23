"use client";

interface ScoreBoardProps {
  teamA: string;
  teamB: string;
  scoreTeamA: number;
  scoreTeamB: number;
  onGoalTeamA: () => void;
  onGoalTeamB: () => void;
}

export function ScoreBoard({
  teamA,
  teamB,
  scoreTeamA,
  scoreTeamB,
  onGoalTeamA,
  onGoalTeamB,
}: ScoreBoardProps) {
  return (
    <div className="flex justify-around items-center bg-gray-900 p-6 rounded-lg">
      <div className="text-center">
        <p className="text-lg mb-2">{teamA}</p>
        <div className="text-5xl font-bold mb-4">{scoreTeamA}</div>
        <button
          onClick={onGoalTeamA}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
        >
          + Gol
        </button>
      </div>

      <div className="text-4xl font-bold">-</div>

      <div className="text-center">
        <p className="text-lg mb-2">{teamB}</p>
        <div className="text-5xl font-bold mb-4">{scoreTeamB}</div>
        <button
          onClick={onGoalTeamB}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
        >
          + Gol
        </button>
      </div>
    </div>
  );
}