"use client";

import { useState, useEffect } from "react";
import { MatchRecord } from "@/types";
import { getColorByTeam } from "@/lib/helpers/helpers";
import { toast } from "react-toastify";

interface EditLastMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastMatch: MatchRecord | null;
  onSave: (editedMatch: MatchRecord) => void;
}

export function EditLastMatchModal({
  isOpen,
  onClose,
  lastMatch,
  onSave,
}: EditLastMatchModalProps) {
  const [editedScores, setEditedScores] = useState({ teamA: 0, teamB: 0 });
  const [editedGoals, setEditedGoals] = useState<{ [playerId: string]: number }>({});

  useEffect(() => {
    if (lastMatch) {
      setEditedScores({
        teamA: lastMatch.teamA.score,
        teamB: lastMatch.teamB.score,
      });
      
      // Filtrar goles solo para jugadores que participaron en este partido
      const participatingPlayerIds = [
        ...lastMatch.teamA.members.map(m => m.id),
        ...lastMatch.teamB.members.map(m => m.id)
      ];
      
      const filteredGoals: { [playerId: string]: number } = {};
      participatingPlayerIds.forEach(playerId => {
        filteredGoals[playerId] = lastMatch.goals[playerId] || 0;
      });
      
      setEditedGoals(filteredGoals);
    }
  }, [lastMatch]);

  if (!isOpen || !lastMatch) return null;

  const handleScoreChange = (team: "teamA" | "teamB", newScore: number) => {
    if (newScore >= 0 && newScore <= 10) {
      const currentScore = editedScores[team];
      setEditedScores(prev => ({ ...prev, [team]: newScore }));

      // Si el nuevo marcador es menor que el actual, quitar goles automáticamente
      if (newScore < currentScore) {
        const teamPlayers = team === "teamA" ? lastMatch.teamA.members : lastMatch.teamB.members;
        const goalDifference = currentScore - newScore;
        
        // Crear una copia de los goles editados
        const newEditedGoals = { ...editedGoals };
        
        // Quitar goles empezando por los jugadores que tienen goles
        let goalsToRemove = goalDifference;
        
        for (const player of teamPlayers) {
          if (goalsToRemove <= 0) break;
          
          const currentPlayerGoals = newEditedGoals[player.id] || 0;
          if (currentPlayerGoals > 0) {
            const goalsToRemoveFromPlayer = Math.min(currentPlayerGoals, goalsToRemove);
            newEditedGoals[player.id] = currentPlayerGoals - goalsToRemoveFromPlayer;
            goalsToRemove -= goalsToRemoveFromPlayer;
          }
        }
        
        setEditedGoals(newEditedGoals);
      }
    }
  };

  const handleGoalChange = (playerId: string, change: number) => {
    setEditedGoals(prev => {
      const currentGoals = prev[playerId] || 0;
      const newGoals = Math.max(0, currentGoals + change);
      return { ...prev, [playerId]: newGoals };
    });
  };

  const calculateResult = (): "A" | "B" | "draw" => {
    if (editedScores.teamA > editedScores.teamB) return "A";
    if (editedScores.teamB > editedScores.teamA) return "B";
    return "draw";
  };

  const validateGoalsCoherence = (): boolean => {
    // Validar que los goles individuales coincidan con el marcador del equipo
    if (totalGoalsTeamA !== editedScores.teamA) {
      toast.error(`Error: Los goles del ${getColorByTeam(lastMatch.teamA.name as "Equipo 1" | "Equipo 2" | "Equipo 3")} (${totalGoalsTeamA}) no coinciden con el marcador (${editedScores.teamA})`);
      return false;
    }
    
    if (totalGoalsTeamB !== editedScores.teamB) {
      toast.error(`Error: Los goles del ${getColorByTeam(lastMatch.teamB.name as "Equipo 1" | "Equipo 2" | "Equipo 3")} (${totalGoalsTeamB}) no coinciden con el marcador (${editedScores.teamB})`);
      return false;
    }
    
    return true;
  };

  const handleSave = () => {
    // Validar coherencia antes de guardar
    if (!validateGoalsCoherence()) {
      return; // No guardar si hay inconsistencias
    }

    const editedMatch: MatchRecord = {
      ...lastMatch,
      teamA: { ...lastMatch.teamA, score: editedScores.teamA },
      teamB: { ...lastMatch.teamB, score: editedScores.teamB },
      goals: editedGoals,
      result: calculateResult(),
      timestamp: Date.now(),
    };

    onSave(editedMatch);
    onClose();
  };

  const totalGoalsTeamA = lastMatch.teamA.members.reduce(
    (sum, member) => sum + (editedGoals[member.id] || 0),
    0
  );

  const totalGoalsTeamB = lastMatch.teamB.members.reduce(
    (sum, member) => sum + (editedGoals[member.id] || 0),
    0
  );

  // Logic for button visibility
  const teamAHasWon = editedScores.teamA >= 2;
  const teamBHasWon = editedScores.teamB >= 2;
  const gameHasWinner = teamAHasWon || teamBHasWon;
  
  // Goals are fully distributed when individual goals = team score
  const teamAGoalsFullyDistributed = totalGoalsTeamA === editedScores.teamA;
  const teamBGoalsFullyDistributed = totalGoalsTeamB === editedScores.teamB;
  
  // Show score add buttons only if no team has won yet (can always add goals until someone wins)
  const showTeamAAddButtons = !gameHasWinner;
  const showTeamBAddButtons = !gameHasWinner;
  
  // Show player goal add buttons if there are goals available to distribute for that team
  // This allows redistribution of goals and goals for losing teams
  const showTeamAPlayerAddButtons = totalGoalsTeamA < editedScores.teamA && editedScores.teamA > 0;
  const showTeamBPlayerAddButtons = totalGoalsTeamB < editedScores.teamB && editedScores.teamB > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Editar Último Partido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Marcadores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Marcador del Partido</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-center mb-2">
                <h4 className="font-bold text-lg">{getColorByTeam(lastMatch.teamA.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}</h4>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handleScoreChange("teamA", editedScores.teamA - 1)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  disabled={editedScores.teamA <= 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold w-12 text-center">
                  {editedScores.teamA}
                </span>
                {showTeamAAddButtons && (
                  <button
                    onClick={() => handleScoreChange("teamA", editedScores.teamA + 1)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                  >
                    +
                  </button>
                )}
              </div>
              <div className="text-center text-sm text-gray-400 mt-2">
                Goles: {totalGoalsTeamA}
                {teamAHasWon && <span className="text-yellow-400 block">🏆 Ganador</span>}
                {teamAGoalsFullyDistributed && !teamAHasWon && editedScores.teamA > 0 && <span className="text-green-400 block">✓ Goles distribuidos</span>}
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-center mb-2">
                <h4 className="font-bold text-lg">{getColorByTeam(lastMatch.teamB.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}</h4>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handleScoreChange("teamB", editedScores.teamB - 1)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  disabled={editedScores.teamB <= 0}
                >
                  -
                </button>
                <span className="text-2xl font-bold w-12 text-center">
                  {editedScores.teamB}
                </span>
                {showTeamBAddButtons && (
                  <button
                    onClick={() => handleScoreChange("teamB", editedScores.teamB + 1)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                  >
                    +
                  </button>
                )}
              </div>
              <div className="text-center text-sm text-gray-400 mt-2">
                Goles: {totalGoalsTeamB}
                {teamBHasWon && <span className="text-yellow-400 block">🏆 Ganador</span>}
                {teamBGoalsFullyDistributed && !teamBHasWon && editedScores.teamB > 0 && <span className="text-green-400 block">✓ Goles distribuidos</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Goleadores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Goleadores</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Equipo A */}
            <div>
              <h4 className="font-semibold mb-2">{getColorByTeam(lastMatch.teamA.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}</h4>
              <div className="space-y-2">
                {lastMatch.teamA.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-sm">{member.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGoalChange(member.id, -1)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                        disabled={(editedGoals[member.id] || 0) <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">
                        {editedGoals[member.id] || 0}
                      </span>
                      {showTeamAPlayerAddButtons && (
                        <button
                          onClick={() => handleGoalChange(member.id, 1)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipo B */}
            <div>
              <h4 className="font-semibold mb-2">{getColorByTeam(lastMatch.teamB.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}</h4>
              <div className="space-y-2">
                {lastMatch.teamB.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-sm">{member.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGoalChange(member.id, -1)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                        disabled={(editedGoals[member.id] || 0) <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">
                        {editedGoals[member.id] || 0}
                      </span>
                      {showTeamBPlayerAddButtons && (
                        <button
                          onClick={() => handleGoalChange(member.id, 1)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="text-center">
            <span className="text-lg font-semibold">Resultado: </span>
            <span className="text-xl font-bold text-green-400">
              {calculateResult() === "draw" 
                ? "Empate" 
                : calculateResult() === "A" 
                  ? `Ganó ${getColorByTeam(lastMatch.teamA.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}` 
                  : `Ganó ${getColorByTeam(lastMatch.teamB.name as "Equipo 1" | "Equipo 2" | "Equipo 3")}`
              }
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-3 rounded-lg transition-colors ${
              totalGoalsTeamA === editedScores.teamA && totalGoalsTeamB === editedScores.teamB
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {totalGoalsTeamA === editedScores.teamA && totalGoalsTeamB === editedScores.teamB
              ? "Guardar Cambios"
              : "⚠️ Goles inconsistentes"
            }
          </button>
        </div>
      </div>
    </div>
  );
} 