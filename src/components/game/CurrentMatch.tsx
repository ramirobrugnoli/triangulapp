"use client";

import { useGameStore } from "@/store/gameStore";
import { GameTimer } from "./GameTimer";
import { ScoreBoard } from "./ScoreBoard";
import { DailyScoreTable } from "./DailyScoreTable";
import { useRef, useState } from "react";
import { GoalScorerModal } from "./GoalScorerModal";

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
    console.log("gol de", playerId, "para el equipo", team);

    // Aquí registraremos el gol del jugador cuando implementemos la función en el store
    // registerGoal(playerId, team);

    if (newScore === 2) {
      updateDailyScore(activeTeams[`team${team}`].name, "win");
      rotateTeams(team);
      resetGame();
      timerRef.current?.resetTimer();
    }

    setModalOpen(false);
    setSelectedTeam(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-lg text-center">
        <h2 className="text-xl mb-2">Afuera</h2>
        <div className="text-green-500 font-bold">
          {activeTeams.waiting.name}
        </div>
        <div className="text-sm text-gray-400">
          {activeTeams.waiting.members.map((member) => member.name).join(", ")}
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div>
          <div className="font-bold mb-1">{activeTeams.teamA.name}</div>
          <div>
            {activeTeams.teamA.members.map((member) => member.name).join(", ")}
          </div>
        </div>
        <div>
          <div className="font-bold mb-1">{activeTeams.teamB.name}</div>
          <div>
            {activeTeams.teamB.members.map((member) => member.name).join(", ")}
          </div>
        </div>
      </div>

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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Puntajes del día</h2>
        <DailyScoreTable scores={dailyScores} />
      </div>

      <button
        onClick={() => {
          const matchData = {
            date: new Date(),
            scores: dailyScores,
          };
          console.log("Datos a enviar:", matchData);
        }}
        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
      >
        Finalizar Triangular
      </button>
    </div>
  );
}
