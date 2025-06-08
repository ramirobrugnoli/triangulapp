"use client";

import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import Timer from '@/components/ui/Timer';

interface GameTimerProps {
  onTimeUp: () => void;
  isActive: boolean;
  onResetTimer: () => void;
}

export function GameTimer({ onTimeUp, isActive, onResetTimer }: GameTimerProps) {
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
        <div className={`w-full font-sans bg-gray-900 rounded-lg scale-75 transform origin-center`}>
          <div className="relative flex items-center justify-center w-full">
            <button
              className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
              onClick={onResetTimer}
              title="Reiniciar tiempo"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>

            <div className={`text-8xl font-black rounded-lg px-8 py-5 text-center flex-1 digital-font tracking-widest ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <button
              className="absolute right-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
              onClick={() => {/* No toggle functionality needed in game timer */}}
              title={isActive ? "Pausar" : "Continuar"}
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              {isActive ? (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          </div>

          <style jsx global>{`
            @font-face {
              font-family: 'Digital-7';
              src: url('/assets/fonts/digital-7.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
            
            .digital-font {
              font-family: 'Digital-7', 'Courier New', monospace;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}