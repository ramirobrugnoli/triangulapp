'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ResetIcon, PauseIcon, PlayIcon } from './icons';
import TimerDisplay from './TimerDisplay';

interface TimerProps {
  className?: string;
  timeLeft?: number;
  initialMinutes?: number;
  onTimeUp?: () => void;
  onToggle?: () => void;
  onTogglePlay?: (isPaused: boolean) => void;
  onReset?: () => void;
}

const Timer: React.FC<TimerProps> = ({ 
  className = '', 
  initialMinutes = 7, 
  onTimeUp,
  onToggle, 
  onTogglePlay,
  onReset, 
  timeLeft 
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => timeLeft || (initialMinutes * 60));
  const [isPaused, setIsPaused] = useState(true);
  const [initialTime] = useState(() => timeLeft || (initialMinutes * 60));
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle external timeLeft changes
  useEffect(() => {
    if (timeLeft !== undefined) {
      // If timeLeft is reset to initial time, reset the component state
      if (timeLeft === initialTime) {
        setTimeRemaining(initialTime);
        setIsPaused(true);
        setPausedTime(null);
      } else if (!isPaused) {
        // If not paused, use external timeLeft
        setTimeRemaining(timeLeft);
      } else {
        // If paused, store the paused time but don't update display
        if (pausedTime === null) {
          setPausedTime(timeLeft);
        }
      }
    }
  }, [timeLeft, isPaused, pausedTime, initialTime]);

  // Reset component state when initialTime changes
  useEffect(() => {
    setTimeRemaining(initialTime);
    setIsPaused(true);
    setPausedTime(null);
  }, [initialTime]);

  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPaused(true);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, timeRemaining, onTimeUp]);

  // Use paused time when paused, otherwise use current time
  const displayTime = isPaused && pausedTime !== null ? pausedTime : timeRemaining;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  const handleToggle = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    if (newPausedState) {
      // Pausing: store current time
      setPausedTime(timeRemaining);
    } else {
      // Resuming: use stored paused time and clear it
      if (pausedTime !== null) {
        setTimeRemaining(pausedTime);
        setPausedTime(null);
      }
    }
    
    onToggle?.();
    onTogglePlay?.(newPausedState);
  };

  const handleReset = () => {
    setTimeRemaining(initialTime);
    setIsPaused(true);
    setPausedTime(null);
    onReset?.();
    onTogglePlay?.(true);
  };

  return (
    <div className={`w-full font-sans ${className} bg-gray-900 rounded-lg`}>
      <div className="relative flex items-center justify-center w-full">
        <button
          className="absolute left-0 border-none rounded w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white hover:bg-gray-700 hover:bg-opacity-50"
          onClick={handleReset}
          title={!isMounted ? "Cargando..." : "Reiniciar tiempo"}
          disabled={!isMounted}
        >
          <ResetIcon width={40} height={40} />
        </button>
        <TimerDisplay minutes={minutes} seconds={seconds} isPaused={isPaused} isMounted={isMounted} />
        <button
          className="absolute right-0 border-none rounded hover:bg-red-700 hover:bg-opacity-50 w-14 h-14 cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-400 bg-transparent hover:text-white"
          onClick={handleToggle}
          title={!isMounted ? "Cargando..." : (isPaused ? "Continuar" : "Pausar")}
          disabled={!isMounted || displayTime === 0}
        >
          {!isMounted ? (
            <PlayIcon width={40} height={40} />
          ) : (isPaused ? (
            <PlayIcon width={40} height={40} />
          ) : (
            <PauseIcon width={40} height={40} />
          ))}
        </button>
      </div>
    </div>
  );
};

export default Timer; 