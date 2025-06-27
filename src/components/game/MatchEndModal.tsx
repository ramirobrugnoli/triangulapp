import React from 'react';
import { Team } from '@/types';
import { getColorByTeam } from '@/lib/helpers/helpers';

interface MatchEndModalProps {
  isOpen: boolean;
  result: "A" | "B" | "draw";
  teamA: Team;
  teamB: Team;
  onAccept: () => void;
  gameState: {
    lastWinner: string;
    lastDraw: string;
    preCalculatedDrawChoice: "A" | "B" | null;
  };
}

export function MatchEndModal({
  isOpen,
  result,
  teamA,
  teamB,
  onAccept,
  gameState
}: MatchEndModalProps) {
  if (!isOpen) return null;

  const getResultMessage = () => {
    if (result === "draw") {
      return "Empate";
    }
    return result === "A" ? `Ganó ${getColorByTeam(teamA)}` : `Ganó ${getColorByTeam(teamB)}`;
  };

  const getNextTeamOnField = () => {
    if (result === "A") {
      // Si ganó A, A se queda y juega contra el waiting
      return getColorByTeam(teamA);
    } else if (result === "B") {
      // Si ganó B, B se queda y juega contra el waiting
      return getColorByTeam(teamB);
    } else {
      // En caso de empate, se queda el equipo que NO jugó en el partido anterior
      // Necesitamos determinar cuál de los dos equipos actuales se queda
      const { lastWinner, lastDraw, preCalculatedDrawChoice } = gameState;
      
      // Si es el primer partido, usar el valor pre-calculado
      if (lastWinner === "" && lastDraw === "") {
        if (preCalculatedDrawChoice) {
          // preCalculatedDrawChoice indica qué equipo se queda
          return preCalculatedDrawChoice === "A" ? getColorByTeam(teamA) : getColorByTeam(teamB);
        } else {
          // Fallback para casos donde no hay pre-calculado
          return "el equipo que se quede";
        }
      }
      
      // El equipo que NO había jugado en el partido anterior se queda
      if (lastWinner === "A" || lastDraw === "A") {
        // A había jugado antes → B se queda
        return getColorByTeam(teamB);
      } else {
        // B había jugado antes → A se queda
        return getColorByTeam(teamA);
      }
    }
  };

  const getFieldMessage = () => {
    return "Se queda en cancha el equipo";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            {getResultMessage()}
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-300 mb-2">{getFieldMessage()}</p>
            <p className="text-xl font-semibold text-green-500">
              {getNextTeamOnField()}
            </p>
          </div>

          <button
            onClick={onAccept}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
} 