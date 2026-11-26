"use client";

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';

export function GameTimer() {
  const {
    timer,
    toggleTimer,
    resetTimer
  } = useGameStore();

  // El timer queda fijo arriba al hacer scroll; cuando el lugar original
  // sale de pantalla pasa a una versión compacta para no tapar el contenido.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setIsCompact(window.scrollY > 0 && el.getBoundingClientRect().top <= 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const timeLeft = timer.timeLeft;
  const isTimerRunning = timer.isRunning;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const iconSize = isCompact ? 28 : 40;

  return (
      <div
        ref={containerRef}
        data-testid="game-timer"
        data-compact={isCompact}
        className={`sticky top-0 z-40 -mx-4 px-4 transition-all duration-200 ${
          isCompact ? 'bg-gray-800/95 backdrop-blur py-1 shadow-lg shadow-black/40' : ''
        }`}
      >
        <div className="flex items-center justify-center rounded-lg w-full bg-gray-900">
          <div className={`transform origin-center w-full ${isCompact ? '' : 'scale-75'}`}>
            <style jsx>{`
              .timer-display :global(.digital-font) {
              color: ${isTimerRunning ? '#16a34a' : '#dc2626'} !important;
              }
            `}</style>

            <div className="w-full font-sans timer-display bg-gray-900 rounded-lg">
              <div className="relative flex items-center justify-center w-full">
                <button
                  className={`absolute left-0 border-none rounded cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50 ${
                    isCompact ? 'w-10 h-10' : 'w-14 h-14'
                  }`}
                  onClick={resetTimer}
                  title="Reiniciar tiempo"
                >
                  <ResetIcon width={iconSize} height={iconSize} />
                </button>
                <TimerDisplay
                  minutes={minutes}
                  seconds={seconds}
                  isPaused={!isTimerRunning}
                  className={isCompact ? '!text-5xl !py-1' : ''}
                />
                <button
                  className={`absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white ${
                    isCompact ? 'w-10 h-10' : 'w-14 h-14'
                  }`}
                  onClick={toggleTimer}
                  title={isTimerRunning ? "Pausar" : "Continuar"}
                  disabled={timeLeft === 0}
                >
                  {isTimerRunning ? (
                    <PauseIcon width={iconSize} height={iconSize} />
                  ) : (
                    <PlayIcon width={iconSize} height={iconSize} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
