"use client";

import { useGameStore } from "@/store/gameStore";
import { GameTimer } from "./GameTimer";
import { ScoreBoard } from "./ScoreBoard";
import { DailyScoreTable } from "./DailyScoreTable";
import { useState, useEffect } from "react";
import { GoalScorerModal } from "./GoalScorerModal";
import { DailyScorersTable } from "./DailyScorersTable";
import { EditLastMatchModal } from "./EditLastMatchModal";
import { toast, ToastContainer } from "react-toastify";
import { getColorByTeam } from "@/lib/helpers/helpers";
import { MatchRecord } from "@/types";

function GoalIndicator({ goals }: { goals: number }) {
  if (goals === 0) return null;
  if (goals === 1) return <span className="ml-2">⚽</span>;
  return <span className="ml-2"> ⚽ x{goals}</span>;
}

export function CurrentMatch() {
  const {
    activeTeams,
    scores,
    isActive,
    dailyScores,
    updateScore,
    rotateTeams,
    updateDailyScore,
    resetGame,
    setIsActive,
    startTimer,
    stopTimer,
    resetTimer,
    registerGoal,
    finalizeTriangular,
    currentGoals,
    getLastMatch,
    editLastMatch,
  } = useGameStore();

  // Iniciar automáticamente el timer al montar el componente
  useEffect(() => {
    if (!isActive) {
      setIsActive(true);
      startTimer();
    }
  }, [isActive, setIsActive, startTimer]); // Solo ejecutar cuando cambien estas dependencias

  const handleResetTimer = () => {
    resetTimer();
    // Reiniciar automáticamente después del reset
    setIsActive(true);
    startTimer();
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const notify = (message: string) => toast(message);

  const handleTimeUp = () => {
    // Pausar el timer primero
    setIsActive(false);
    stopTimer();
    
    if (scores.teamA > scores.teamB) {
      updateDailyScore(activeTeams.teamA.name, "normalWin");
      rotateTeams("A");
    } else if (scores.teamB > scores.teamA) {
      updateDailyScore(activeTeams.teamB.name, "normalWin");
      rotateTeams("B");
    } else {
      updateDailyScore(activeTeams.teamA.name, "draw");
      updateDailyScore(activeTeams.teamB.name, "draw");
      rotateTeams("draw");
    }
    resetGame();
  };

  const handleGoalClick = (team: "A" | "B") => {
    setSelectedTeam(team);
    setModalOpen(true);
  };

  const handleGoalConfirm = (playerId: string) => {
    const team = selectedTeam!;
    const currentScore = scores[`team${team}`];
    const newScore = currentScore + 1;
    updateScore(team, newScore);

    registerGoal(playerId);

    if (newScore === 2) {
      // Pausar el timer primero
      setIsActive(false);
      stopTimer();
      
      updateDailyScore(activeTeams[`team${team}`].name, "win");
      rotateTeams(team);
      resetGame();
      // No llamar resetTimer aquí, rotateTeams ya maneja el historial
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
    notify("Partido editado correctamente. Los equipos y puntajes se han actualizado.");
  };

  return (
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />
      <GameTimer 
        onTimeUp={handleTimeUp} 
        isActive={isActive} 
        onResetTimer={handleResetTimer}
      />

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
        lastMatch={getLastMatch()}
        onSave={handleSaveEditedMatch}
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
                <GoalIndicator goals={currentGoals[member.id] || 0} />
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
                <GoalIndicator goals={currentGoals[member.id] || 0} />
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
                <GoalIndicator goals={currentGoals[member.id] || 0} />
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
            disabled={!getLastMatch()}
            className={`w-full py-2 rounded-lg ${
              !getLastMatch()
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
      </div>
    </>
  );
}
