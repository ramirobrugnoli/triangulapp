"use client";

import { useGameStore } from "@/store/gameStore";
import { GameTimer } from "./GameTimer";
import { ScoreBoard } from "./ScoreBoard";
import { DailyScoreTable } from "./DailyScoreTable";
import { useState, useEffect } from "react";
import { GoalScorerModal } from "./GoalScorerModal";
import { DailyScorersTable } from "./DailyScorersTable";
import { EditLastMatchModal } from "./EditLastMatchModal";
import { MatchEndModal } from "./MatchEndModal";
import { toast, ToastContainer } from "react-toastify";
import { getColorByTeam } from "@/lib/helpers/helpers";
import { MatchRecord } from "@/types";
import "react-toastify/dist/ReactToastify.css";
import { MatchHistory } from "./MatchHistory";

function GoalIndicator({ goals }: { goals: number }) {
  if (goals === 0) return null;
  if (goals === 1) return <span className="ml-2">⚽</span>;
  return <span className="ml-2"> ⚽ x{goals}</span>;
}

export function CurrentMatch() {
  const {
    activeTeams,
    scores,
    setIsActive,
    currentMatchGoals,
    dailyScores,
    updateScore,
    registerGoal,
    getCurrentMatchGoals,
    finalizeTriangular,
    stopTimer,
    getLastMatch,
    editLastMatch,
    matchEndModal,
    showMatchEndModal,
    acceptMatchEnd,
    lastWinner,
    lastDraw,
    getMatchHistory,
    cancelTriangular,
  } = useGameStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const notify = (message: string) => toast(message);

  const handleGoalClick = (team: "A" | "B") => {
    setSelectedTeam(team);
    setModalOpen(true);
  };

  const handleGoalConfirm = (playerId: string) => {
    const team = selectedTeam!;
    
    registerGoal(playerId);
    
    const newScore = getCurrentMatchGoals(team);
    updateScore(team, newScore);

    if (newScore >= 2) {
      setIsActive(false);
      stopTimer();
      
      showMatchEndModal(team);
    }

    setModalOpen(false);
    setSelectedTeam(null);
  };

  const handleFinishTriangular = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await finalizeTriangular();
      notify("Triangular finalizado correctamente!");
    } catch (error) {
      console.error("Error al finalizar el triangular:", error);
      notify("Error al finalizar el triangular");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLastMatch = () => {
    const lastMatch = getLastMatch();
    if (lastMatch) {
      setEditModalOpen(true);
    } else {
      notify("No hay partidos anteriores para editar");
    }
  };

  const handleSaveEditedMatch = (editedMatch: MatchRecord) => {
    editLastMatch(editedMatch);
    notify("Último partido editado correctamente. Se han actualizado los puntajes y goleadores.");
  };

  const handleCancelTriangular = () => {
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    cancelTriangular();
    setCancelModalOpen(false);
    notify("Triangular cancelado. Se han eliminado todos los datos del triangular en curso.");
  };

  const lastMatch = mounted ? getLastMatch() : null;

  return (
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />
      <GameTimer />

      <ScoreBoard
        teamA={getColorByTeam(activeTeams.teamA.name)}
        teamB={getColorByTeam(activeTeams.teamB.name)}
        scoreTeamA={scores.teamA}
        scoreTeamB={scores.teamB}
        onGoalTeamA={() => handleGoalClick("A")}
        onGoalTeamB={() => handleGoalClick("B")}
      />

      <GoalScorerModal
        isOpen={modalOpen}
        team={selectedTeam || "A"}
        players={selectedTeam ? activeTeams[`team${selectedTeam}`].members : []}
        onClose={() => setModalOpen(false)}
        onSelect={handleGoalConfirm}
      />

      <EditLastMatchModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        lastMatch={lastMatch}
        onSave={handleSaveEditedMatch}
      />

      <MatchEndModal
        isOpen={matchEndModal.isOpen}
        result={matchEndModal.result || "draw"}
        teamA={activeTeams.teamA.name}
        teamB={activeTeams.teamB.name}
        onAccept={acceptMatchEnd}
        gameState={{ 
          lastWinner, 
          lastDraw, 
          preCalculatedDrawChoice: matchEndModal.preCalculatedDrawChoice ?? null 
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="font-bold mb-2 text-lg text-green-500">
            {getColorByTeam(activeTeams.teamA.name)}
          </div>
          <div className="text-sm text-gray-400 leading-relaxed space-y-1">
            {activeTeams.teamA.members.map((member) => (
              <div key={member.id} className="flex items-center">
                <span>{member.name}</span>
                <GoalIndicator goals={currentMatchGoals[member.id] || 0} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="font-bold mb-2 text-lg text-green-500">
            {getColorByTeam(activeTeams.teamB.name)}
          </div>
          <div className="text-sm text-gray-400 leading-relaxed space-y-1">
            {activeTeams.teamB.members.map((member) => (
              <div key={member.id} className="flex items-center">
                <span>{member.name}</span>
                <GoalIndicator goals={currentMatchGoals[member.id] || 0} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <h2 className="text-xl mb-2">Afuera</h2>
          <div className="text-green-500 font-bold">
            {getColorByTeam(activeTeams.waiting.name)}
          </div>
          <div className="text-sm text-gray-400 mt-2 flex flex-col items-center space-y-1">
            {activeTeams.waiting.members.map((member) => (
              <div key={member.id} className="flex items-center">
                <span>{member.name}</span>
                <GoalIndicator goals={currentMatchGoals[member.id] || 0} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Puntajes del día</h2>
          <DailyScoreTable scores={dailyScores} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Goleadores del día</h2>
          <DailyScorersTable />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEditLastMatch}
            disabled={!lastMatch}
            className={`w-full py-2 rounded-lg ${
              !lastMatch
                ? "bg-gray-700 cursor-not-allowed text-gray-500"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            Editar Último Partido
          </button>
          
          <button
            onClick={handleFinishTriangular}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg ${
              isSubmitting
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Finalizar Triangular
          </button>
        </div>

        {/* Historial de Partidos */}
        {mounted && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Historial de Partidos</h2>
            <MatchHistory matches={getMatchHistory()} />
          </div>
        )}

        {/* Botón para cancelar triangular */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleCancelTriangular}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Cancelar Triangular</span>
          </button>
        </div>
      </div>

      {/* Modal de confirmación para cancelar triangular */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-4">
                ¿Cancelar Triangular?
              </h3>
              <p className="text-gray-300 mb-6">
                Esta acción eliminará todos los datos del triangular en curso:
                <br />
                • Puntajes del día
                • Historial de partidos
                • Goleadores actuales
                <br /><br />
                <strong>Esta acción no se puede deshacer.</strong>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
