"use client";

import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';

interface GameTimerProps {
  onTimeUp: () => void;
  isActive: boolean;
  onResetTimer: () => void;
  onToggleTimer?: () => void;
}

export function GameTimer({ onTimeUp, isActive, onResetTimer, onToggleTimer }: GameTimerProps) {
  const { getTimeLeft, decrementTimer } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [whistleHasPlayed, setWhistleHasPlayed] = useState(false);

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to play referee whistle
  const playWhistle = () => {
    try {
      const audio = new Audio('/assets/sounds/referee-whistle.mp3');
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch(error => {
        console.log('Could not play whistle sound:', error);
      });
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Only run the timer if the game is active
    if (isActive && mounted) {
      intervalId = setInterval(() => {
        const currentTime = getTimeLeft();

        if (currentTime <= 0) {
          clearInterval(intervalId);
          onTimeUp();
          return;
        }

        // Play whistle when reaching exactly 1 minute (60 seconds)
        if (currentTime === 60 && !whistleHasPlayed) {
          playWhistle();
          setWhistleHasPlayed(true);
        }

        decrementTimer();
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive, mounted, getTimeLeft, decrementTimer, onTimeUp, whistleHasPlayed]);

  // Reset whistle flag when timer is reset to full time
  useEffect(() => {
    const currentTime = getTimeLeft();
    if (currentTime >= 7 * 60) { // 7 minutes = 420 seconds
      setWhistleHasPlayed(false);
    }
  }, [getTimeLeft]);

  const timeLeft = getTimeLeft();
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center justify-center rounded-lg w-full bg-gray-900">
      {mounted && (
        <div className="scale-75 transform origin-center w-full">
          <style jsx>{`
            .timer-display :global(.digital-font) {
              color: ${isActive ? '#16a34a' : '#dc2626'} !important;
            }
          `}</style>
          <div className="w-full font-sans timer-display bg-gray-900 rounded-lg">
            <div className="relative flex items-center justify-center w-full">
              <button
                className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
                onClick={onResetTimer}
                title="Reiniciar tiempo"
              >
                <ResetIcon width={40} height={40} />
              </button>
              <TimerDisplay minutes={minutes} seconds={seconds} isPaused={!isActive} isMounted={mounted} />
              <button
                className="absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white"
                onClick={onToggleTimer}
                title={isActive ? "Pausar" : "Continuar"}
                disabled={timeLeft === 0}
              >
                {isActive ? (
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