"use client";

import { useGameStore } from "@/store/gameStore";
import { GameTimer } from "./GameTimer";
import { ScoreBoard } from "./ScoreBoard";
import { DailyScoreTable } from "./DailyScoreTable";
import { useRef } from "react";

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

  const handleTimeUp = () => {
    if (scores.teamA > scores.teamB) {
      updateDailyScore(activeTeams.teamA, "normalWin");
      rotateTeams("A");
    } else if (scores.teamB > scores.teamA) {
      updateDailyScore(activeTeams.teamB, "normalWin");
      rotateTeams("B");
    } else {
      updateDailyScore(activeTeams.teamA, "draw");
      updateDailyScore(activeTeams.teamB, "draw");
      rotateTeams("draw");
    }
    resetGame();
  };

  const handleGoal = (team: "A" | "B") => {
    const currentScore = scores[`team${team}`];
    const newScore = currentScore + 1;
    updateScore(team, newScore);

    if (newScore === 2) {
      updateDailyScore(activeTeams[`team${team}`], "win");
      rotateTeams(team);
      resetGame();
      timerRef.current?.resetTimer();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-lg text-center">
        <h2 className="text-xl mb-2">Afuera</h2>
        <div className="text-green-500 font-bold">{activeTeams.waiting}</div>
      </div>

      <GameTimer onTimeUp={handleTimeUp} isActive={isActive} />

      <ScoreBoard
        teamA={activeTeams.teamA}
        teamB={activeTeams.teamB}
        scoreTeamA={scores.teamA}
        scoreTeamB={scores.teamB}
        onGoalTeamA={() => handleGoal("A")}
        onGoalTeamB={() => handleGoal("B")}
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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Puntajes del día</h2>
        <DailyScoreTable scores={dailyScores} />
      </div>

      <button
        onClick={() => {
          // Aquí iría la lógica para enviar los datos al backend
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
