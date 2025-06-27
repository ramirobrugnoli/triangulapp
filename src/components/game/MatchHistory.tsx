"use client";

import { MatchRecord, Team } from "@/types";
import { getColorByTeam } from "@/lib/helpers/helpers";

interface MatchHistoryProps {
  matches: MatchRecord[];
}

// Helper function to safely cast team names
const getTeamColor = (teamName: string): string => {
  const validTeams: Team[] = ["Equipo 1", "Equipo 2", "Equipo 3"];
  const isValidTeam = validTeams.includes(teamName as Team);
  return isValidTeam ? getColorByTeam(teamName as Team) : teamName;
};

export function MatchHistory({ matches }: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center text-gray-400">
        No hay partidos jugados aún
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getResultText = (match: MatchRecord) => {
    if (match.result === "draw") {
      return "Empate";
    } else if (match.result === "A") {
      return `Ganó ${getTeamColor(match.teamA.name)}`;
    } else {
      return `Ganó ${getTeamColor(match.teamB.name)}`;
    }
  };

  const getResultColor = (match: MatchRecord) => {
    if (match.result === "draw") {
      return "text-yellow-400";
    } else {
      return "text-green-400";
    }
  };

  const getTotalGoals = (match: MatchRecord) => {
    return Object.values(match.goals).reduce((sum, goals) => sum + goals, 0);
  };

  return (
    <div className="space-y-3">
      {matches.map((match, index) => (
        <div key={match.timestamp} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">#{matches.length - index}</span>
              <span className="text-sm text-gray-400">{formatTime(match.timestamp)}</span>
            </div>
            <span className={`text-sm font-semibold ${getResultColor(match)}`}>
              {getResultText(match)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Equipo A */}
            <div className="text-center">
              <div className="font-semibold text-green-500 mb-1">
                {getTeamColor(match.teamA.name)}
              </div>
              <div className="text-2xl font-bold mb-1">{match.teamA.score}</div>
              <div className="text-xs text-gray-400">
                {match.teamA.members.map(m => m.name).join(", ")}
              </div>
            </div>

            {/* VS */}
            <div className="text-center flex items-center justify-center">
              <span className="text-gray-500 font-bold">VS</span>
            </div>

            {/* Equipo B */}
            <div className="text-center">
              <div className="font-semibold text-green-500 mb-1">
                {getTeamColor(match.teamB.name)}
              </div>
              <div className="text-2xl font-bold mb-1">{match.teamB.score}</div>
              <div className="text-xs text-gray-400">
                {match.teamB.members.map(m => m.name).join(", ")}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-3 pt-2 border-t border-gray-700 flex justify-between text-xs text-gray-400">
            <span>Esperando: {getTeamColor(match.waiting.name)}</span>
            <span>Total goles: {getTotalGoals(match)}</span>
          </div>

          {/* Goleadores si hay goles */}
          {getTotalGoals(match) > 0 && (
            <div className="mt-2 text-xs">
              <span className="text-gray-500">Goleadores: </span>
              {Object.entries(match.goals)
                .filter(([, goals]) => goals > 0)
                .map(([playerId, goals]) => {
                  // Buscar el nombre del jugador en los equipos
                  const allPlayers = [...match.teamA.members, ...match.teamB.members];
                  const player = allPlayers.find(p => p.id === playerId);
                  return player ? `${player.name} (${goals})` : `ID:${playerId} (${goals})`;
                })
                .join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 