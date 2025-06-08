"use client";

import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import Timer from '@/components/ui/Timer';

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

  return (
    <div className="flex items-center justify-center rounded-lg w-full bg-gray-900">
      {mounted && (
        <GameTimerComponent 
          timeLeft={timeLeft}
          isActive={isActive}
          onReset={onResetTimer}
          onToggle={onToggleTimer}
        />
      )}
    </div>
  );
}

interface GameTimerComponentProps {
  timeLeft: number;
  isActive: boolean;
  onReset: () => void;
  onToggle?: () => void;
}

function GameTimerComponent({ timeLeft, isActive, onReset, onToggle }: GameTimerComponentProps) {
  return (
    <div className="scale-75 transform origin-center w-full">
      <style jsx>{`
        .timer-display :global(.digital-font) {
          color: ${isActive ? '#16a34a' : '#dc2626'} !important;
        }
      `}</style>
      <Timer
        className="timer-display"
        initialMinutes={7}
        onReset={onReset}
        onToggle={onToggle}
        timeLeft={timeLeft}
      />
    </div>
  );
}