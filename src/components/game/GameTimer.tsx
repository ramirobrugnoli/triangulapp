"use client";

import { useGameStore } from '@/store/gameStore';
import { useTimerSocket } from '@/hooks/useTimerSocket';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';
import { useEffect } from 'react';

export function GameTimer() {
  const { 
    handleTimeUp,
    playWhistle,
    setSocketResetFunction
  } = useGameStore();

  const {
    timerState,
    isConnected,
    toggleTimer,
    resetTimer
  } = useTimerSocket({
    gameId: 'current-match',
    onTimeUp: handleTimeUp,
    onWhistle: playWhistle
  });

  // Registrar la función resetTimer del socket en el gameStore
  useEffect(() => {
    setSocketResetFunction(resetTimer);
    
    // Cleanup function para limpiar la referencia cuando el componente se desmonte
    return () => {
      setSocketResetFunction(null);
    };
  }, [resetTimer, setSocketResetFunction]);

  const timeLeft = timerState.timeLeft;
  const isTimerRunning = timerState.isRunning;
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
        {/* Indicador de conexión WebSocket */}
        <div className="flex justify-center mb-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Conectado al servidor' : 'Desconectado del servidor'}>
          </div>
        </div>
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