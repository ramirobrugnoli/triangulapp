"use client";

import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';

interface GameTimerProps {
  onTimeUp: () => void;
  isActive: boolean;
}

export function GameTimer({ onTimeUp, isActive }: GameTimerProps) {
  const { getTimeLeft } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      const updateTimer = () => {
        const newTimeLeft = getTimeLeft();
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft <= 0) {
          clearInterval(intervalId);
          onTimeUp();
        }
      };

      intervalId = setInterval(updateTimer, 100);
      updateTimer();
    }

    return () => clearInterval(intervalId);
  }, [isActive, getTimeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-4xl font-bold text-center bg-gray-700 p-4 rounded-lg">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}