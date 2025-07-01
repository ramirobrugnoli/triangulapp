"use client";

import { useGameStore } from '@/store/gameStore';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';

export function GameTimer() {
  const { 
    timer,
    toggleTimer,
    resetTimer
  } = useGameStore();

  const timeLeft = timer.timeLeft;
  const isTimerRunning = timer.isRunning;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center justify-center rounded-lg w-full bg-gray-900">
        <div className="scale-75 transform origin-center w-full">
          <style jsx>{`
            .timer-display :global(.digital-font) {
            color: ${isTimerRunning ? '#16a34a' : '#dc2626'} !important;
            }
          `}</style>

          <div className="w-full font-sans timer-display bg-gray-900 rounded-lg">
            <div className="relative flex items-center justify-center w-full">
              <button
                className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
                onClick={resetTimer}
                title="Reiniciar tiempo"
              >
                <ResetIcon width={40} height={40} />
              </button>
              <TimerDisplay minutes={minutes} seconds={seconds} isPaused={!isTimerRunning} />
              <button
                className="absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white"
                onClick={toggleTimer}
                title={isTimerRunning ? "Pausar" : "Continuar"}
                disabled={timeLeft === 0}
              >
                {isTimerRunning ? (
                  <PauseIcon width={40} height={40} />
                ) : (
                  <PlayIcon width={40} height={40} />
                )}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}