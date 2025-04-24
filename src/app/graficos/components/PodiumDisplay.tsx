import { Player } from "@/types";
import { StatMetric } from "@/types/stats";

interface PodiumDisplayProps {
  topThree: Player[];
  metric: StatMetric;
  onPlayerSelect: (metric: StatMetric, playerName: string) => void;
}

export function PodiumDisplay({ topThree, metric, onPlayerSelect }: PodiumDisplayProps) {
  if (!topThree.length) return null;

  const getPlayerValue = (player: Player, metric: StatMetric) => {
    if (metric === 'goals') return player.stats.goals;
    if (metric === 'wins') return player.stats.wins;
    if (metric === 'normalWins') return player.stats.normalWins || 0;
    if (metric === 'triangularPoints') return player.stats.points;
    return 0;
  };

  return (
    <div className="flex justify-center items-end space-x-4 mb-8">
      {/* Segundo lugar */}
      {topThree.length > 1 && (
        <div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => onPlayerSelect(metric, topThree[1].name)}
        >
          <div className="text-lg font-bold">{topThree[1].name}</div>
          <div className="bg-green-500 w-24 h-24 flex items-center justify-center rounded-t-lg">
            <span className="text-2xl font-bold">
              {getPlayerValue(topThree[1], metric)}
            </span>
          </div>
          <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
            <span className="text-xl">2°</span>
          </div>
        </div>
      )}
      
      {/* Primer lugar */}
      <div
        className="flex flex-col items-center cursor-pointer"
        onClick={() => onPlayerSelect(metric, topThree[0].name)}
      >
        <div className="text-lg font-bold">{topThree[0].name}</div>
        <div className="bg-yellow-500 w-24 h-32 flex items-center justify-center rounded-t-lg">
          <span className="text-2xl font-bold">
            {getPlayerValue(topThree[0], metric)}
          </span>
        </div>
        <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
          <span className="text-xl">1°</span>
        </div>
      </div>
      
      {/* Tercer lugar */}
      {topThree.length > 2 && (
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => onPlayerSelect(metric, topThree[2].name)}
        >
          <div className="text-lg font-bold">{topThree[2].name}</div>
          <div className="bg-blue-500 w-24 h-16 flex items-center justify-center rounded-t-lg">
            <span className="text-2xl font-bold">
              {getPlayerValue(topThree[2], metric)}
            </span>
          </div>
          <div className="bg-gray-700 w-24 h-16 flex items-center justify-center">
            <span className="text-xl">3°</span>
          </div>
        </div>
      )}
    </div>
  );
} 