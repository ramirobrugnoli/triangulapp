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

  // El timer grande queda en su lugar. Cuando empieza a salir por arriba de la
  // pantalla aparece una barra compacta fija. Al ser `fixed` no cambia la altura
  // de la página, así que el scroll no salta.
  const fullTimerRef = useRef<HTMLDivElement>(null);
  const [showCompact, setShowCompact] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = fullTimerRef.current;
      if (!el) return;
      setShowCompact(el.getBoundingClientRect().top < 0);
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

  const resetButton = (compact: boolean) => (
    <button
      className={`absolute left-0 border-none rounded cursor-pointer flex items-center justify-center transition-colors duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50 ${
        compact ? 'w-10 h-10' : 'w-14 h-14'
      }`}
      onClick={resetTimer}
      title="Reiniciar tiempo"
    >
      <ResetIcon width={compact ? 28 : 40} height={compact ? 28 : 40} />
    </button>
  );

  const toggleButton = (compact: boolean) => (
    <button
      className={`absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 cursor-pointer flex items-center justify-center transition-colors duration-200 text-gray-400 bg-transparent hover:text-white ${
        compact ? 'w-10 h-10' : 'w-14 h-14'
      }`}
      onClick={toggleTimer}
      title={isTimerRunning ? "Pausar" : "Continuar"}
      disabled={timeLeft === 0}
    >
      {isTimerRunning ? (
        <PauseIcon width={compact ? 28 : 40} height={compact ? 28 : 40} />
      ) : (
        <PlayIcon width={compact ? 28 : 40} height={compact ? 28 : 40} />
      )}
    </button>
  );

  return (
    <>
      <style jsx>{`
        .timer-display :global(.digital-font) {
          color: ${isTimerRunning ? '#16a34a' : '#dc2626'} !important;
        }
      `}</style>

      <div
        ref={fullTimerRef}
        data-testid="game-timer"
        className="flex items-center justify-center rounded-lg w-full bg-gray-900"
      >
        <div className="scale-75 transform origin-center w-full">
          <div className="w-full font-sans timer-display bg-gray-900 rounded-lg">
            <div className="relative flex items-center justify-center w-full">
              {resetButton(false)}
              <TimerDisplay minutes={minutes} seconds={seconds} isPaused={!isTimerRunning} />
              {toggleButton(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Siempre montada: entra y sale animando solo transform y opacidad.
          Mientras está oculta queda inert (no se puede tocar ni enfocar). */}
      <div
        data-testid="game-timer-compact"
        data-visible={showCompact}
        aria-hidden={!showCompact}
        inert={!showCompact}
        className={`fixed top-0 inset-x-0 !mt-0 z-40 bg-gray-900/95 backdrop-blur shadow-lg shadow-black/40 border-b border-gray-700
          transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none will-change-transform
          ${showCompact ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
          <div className="container mx-auto px-4">
            <div className="timer-display relative flex items-center justify-center w-full">
              {resetButton(true)}
              <TimerDisplay
                minutes={minutes}
                seconds={seconds}
                isPaused={!isTimerRunning}
                className="!text-5xl !py-1"
              />
              {toggleButton(true)}
            </div>
          </div>
      </div>
    </>
  );
}
