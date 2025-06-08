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
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        const currentTime = getTimeLeft();

        if (currentTime <= 0) {
          clearInterval(intervalId);
          onTimeUp();
          return;
        }

        decrementTimer();
        setTimeLeft(currentTime - 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive, getTimeLeft, decrementTimer, onTimeUp]);

  // Update local state when store changes
  useEffect(() => {
    setTimeLeft(getTimeLeft());
  }, [getTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timerStartTime = new Date();
  timerStartTime.setHours(0, minutes, seconds, 0);

  return (
    <div className="flex items-center justify-center rounded-lg  w-full bg-gray-900">
      {mounted && (
        <Timer
          initialMinutes={7}
          onTimeUp={onTimeUp}
          isActive={isActive}
          onReset={onResetTimer}
          className="scale-75 transform origin-center"
        />
      )}
    </div>
  );
}