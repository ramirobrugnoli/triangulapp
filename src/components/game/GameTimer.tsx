"use client";

import React, { useEffect, useState } from 'react';
import { useTimeLeft, useIsTimerRunning, useTimerActions } from '@/store/timerStore';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';

interface GameTimerProps {
  onTimeUp: () => void;
}

export function GameTimer({ onTimeUp }: GameTimerProps) {
  const timeLeft = useTimeLeft();
  const isRunning = useIsTimerRunning();
  const { start, pause, reset } = useTimerActions();
  
  const [mounted, setMounted] = useState(false);
  const [whistleHasPlayed, setWhistleHasPlayed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Para evitar que onTimeUp se llame múltiples veces
      if (isRunning) {
        onTimeUp();
      }
    }
    
    if (timeLeft === 60 && !whistleHasPlayed) {
      playWhistle();
      setWhistleHasPlayed(true);
    }
    
    // Reset whistle flag when timer is reset
    if (timeLeft >= (7 * 60) - 1) { 
        setWhistleHasPlayed(false);
    }
  }, [timeLeft, onTimeUp, whistleHasPlayed, isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const playWhistle = () => {
    try {
      const audio = new Audio('/assets/sounds/referee-whistle.mp3');
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.log('Could not play whistle sound:', error);
      });
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center justify-center rounded-lg w-full bg-gray-900">
      {mounted && (
        <div className="scale-75 transform origin-center w-full">
          <style jsx>{`
            .timer-display :global(.digital-font) {
              color: ${isRunning ? '#16a34a' : '#dc2626'} !important;
            }
          `}</style>
          <div className="w-full font-sans timer-display bg-gray-900 rounded-lg">
            <div className="relative flex items-center justify-center w-full">
              <button
                className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
                onClick={reset}
                title="Reiniciar tiempo"
              >
                <ResetIcon width={40} height={40} />
              </button>
              <TimerDisplay minutes={minutes} seconds={seconds} isPaused={!isRunning} isMounted={mounted} />
              <button
                className="absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white"
                onClick={handleToggle}
                title={isRunning ? "Pausar" : "Continuar"}
                disabled={timeLeft === 0 && !isRunning}
              >
                {isRunning ? (
                  <PauseIcon width={40} height={40} />
                ) : (
                  <PlayIcon width={40} height={40} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}