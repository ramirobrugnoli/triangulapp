"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ResetIcon, PauseIcon, PlayIcon } from '@/components/ui/icons';
import TimerDisplay from '@/components/ui/TimerDisplay';

interface GameTimerProps {
  onTimeUp: () => void;
  isActive: boolean;
  onResetTimer: () => void;
  onToggleTimer?: () => void;
}

export function GameTimer({ onTimeUp, isActive, onResetTimer, onToggleTimer }: GameTimerProps) {
  const { getTimeLeft, setTimeLeft } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [whistleHasPlayed, setWhistleHasPlayed] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Initialize the worker
    const worker = new Worker('/timer-worker.js');
    workerRef.current = worker;

    worker.postMessage({ command: 'setTime', value: getTimeLeft() });

    worker.onmessage = (e) => {
      const { type, timeLeft } = e.data;
      if (type === 'tick') {
        setTimeLeft(timeLeft);
        if (timeLeft <= 0) {
          onTimeUp();
        }
        // Play whistle when reaching exactly 1 minute (60 seconds)
        if (timeLeft === 60 && !whistleHasPlayed) {
          playWhistle();
          setWhistleHasPlayed(true);
        }
      } else if (type === 'done') {
        onTimeUp();
      }
    };
    
    return () => {
      worker.terminate();
    };
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (workerRef.current) {
        if (isActive) {
            workerRef.current.postMessage({ command: 'start' });
        } else {
            workerRef.current.postMessage({ command: 'pause' });
        }
    }
  }, [isActive]);

  const handleReset = () => {
    onResetTimer();
    // After onResetTimer, the store will be updated. We need to get the new time and send it to the worker.
    // useGameStore.getState() gives us access to the latest state.
    const newTime = useGameStore.getState().timer.MATCH_DURATION;
    if (workerRef.current) {
        workerRef.current.postMessage({ command: 'setTime', value: newTime });
    }
    setWhistleHasPlayed(false);
  }

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
                onClick={handleReset}
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