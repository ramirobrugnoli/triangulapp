"use client";

import { useGameStore } from "@/store/gameStore";
import { GameTimer } from "./GameTimer";
import { ScoreBoard } from "./ScoreBoard";
import { DailyScoreTable } from "./DailyScoreTable";
import { useRef, useState } from "react";
import { GoalScorerModal } from "./GoalScorerModal";
import { DailyScorersTable } from "./DailyScorersTable";
import { toast, ToastContainer } from "react-toastify";

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
    registerGoal,
    finalizeTriangular,
    currentGoals,
  } = useGameStore();

  const handleStartStop = () => {
    if (!isActive) {
      setIsActive(true);
      startTimer();
    } else {
      setIsActive(false);
      stopTimer();
    }
  };

  const timerRef = useRef<{ resetTimer: () => void } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const notify = (message: string) => toast(message);

  const handleTimeUp = () => {
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
      updateDailyScore(activeTeams[`team${team}`].name, "win");
      rotateTeams(team);
      resetGame();
      timerRef.current?.resetTimer();
    }

    setModalOpen(false);
    setSelectedTeam(null);
  };

  const handleFinishTriangular = async () => {
    try {
      await finalizeTriangular();
      notify("Triangular finalizado correctamente!");
    } catch (error) {
      console.error("Error al finalizar el triangular:", error);
      notify("Error al finalizar el triangular");
    }
  };

  return (
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />
      <button
        onClick={handleStartStop}
        className={`w-full py-3 rounded-lg ${
          isActive
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isActive ? "Pausar Partido" : "Iniciar Partido"}
      </button>
      <GameTimer onTimeUp={handleTimeUp} isActive={isActive} />

      <ScoreBoard
        teamA={activeTeams.teamA.name}
        teamB={activeTeams.teamB.name}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="font-bold mb-2 text-lg text-green-500">
            {activeTeams.teamA.name}
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
            {activeTeams.teamB.name}
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
            {activeTeams.waiting.name}
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

        <button
          onClick={handleFinishTriangular}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          Finalizar Triangular
        </button>
      </div>
    </>
  );
}
