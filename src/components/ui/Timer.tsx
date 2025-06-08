'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ResetIcon, PauseIcon, PlayIcon } from './icons';
import TimerDisplay from './TimerDisplay';

// Claves para localStorage
const TIMER_KEY = 'triangulapp_timer_seconds';
const PAUSED_KEY = 'triangulapp_paused_seconds';
const IS_PAUSED_KEY = 'triangulapp_is_paused';

interface TimerProps {
  className?: string;
  timeLeft?: number;
  initialMinutes?: number;
  onTimeUp?: () => void;
  onToggle?: () => void;
  onReset?: () => void;
}

const Timer: React.FC<TimerProps> = ({ className = '', initialMinutes = 7, onTimeUp, onToggle, onReset, timeLeft }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isActive, setIsActive] = useState(false); // Start inactive
  const [isPaused, setIsPaused] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(IS_PAUSED_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Función para leer desde localStorage
  const getFromLocalStorage = (key: string, defaultValue: number) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : defaultValue;
    }
    return defaultValue;
  };

  // Función para guardar en localStorage
  const saveToLocalStorage = (key: string, value: number | boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value.toString());
    }
  };

  // Estados inicializados desde localStorage
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(() =>
    getFromLocalStorage(TIMER_KEY, timeLeft || (initialMinutes * 60))
  );
  const [pausedSeconds, setPausedSeconds] = useState(() =>
    getFromLocalStorage(PAUSED_KEY, 0)
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set mounted state after component mounts and start timer
  useEffect(() => {
    setIsMounted(true);

    // Leer estado desde localStorage cuando se monta el componente
    const storedSeconds = getFromLocalStorage(TIMER_KEY, timeLeft || (initialMinutes * 60));
    const storedPausedSeconds = getFromLocalStorage(PAUSED_KEY, 0);
    const storedIsPaused = typeof window !== 'undefined' ? localStorage.getItem(IS_PAUSED_KEY) === 'true' : false;

    setTotalSecondsLeft(storedSeconds);
    setPausedSeconds(storedPausedSeconds);
    setIsPaused(storedIsPaused);

    console.log('Estado cargado desde localStorage:', {
      storedSeconds,
      storedPausedSeconds,
      storedIsPaused
    });

    // Use setTimeout to ensure state update happens after mount
    setTimeout(() => {
      setIsActive(true); // Auto start timer when component mounts
    }, 0);
  }, []);

  // Handle external timeLeft changes - actualizar localStorage también
  useEffect(() => {
    if (timeLeft !== undefined) {
      setTotalSecondsLeft(timeLeft);
      saveToLocalStorage(TIMER_KEY, timeLeft);
    }
  }, [timeLeft]);

  // Initialize totalSeconds based on initialMinutes when no timeLeft
  useEffect(() => {
    if (timeLeft === undefined) {
      const newTime = initialMinutes * 60;
      setTotalSecondsLeft(newTime);
      saveToLocalStorage(TIMER_KEY, newTime);
    }
  }, [initialMinutes, timeLeft]);

  // useEffect hook to manage the countdown interval - following Medium article pattern
  useEffect(() => {
    // If the timer is active and not paused
    // Set an interval to decrease the time left
    timerRef.current = setInterval(() => {
      if (isPaused) {
        return;
      }
      setTotalSecondsLeft(prev => {
        if (prev > 0) {
          const newTime = prev - 1;
          saveToLocalStorage(TIMER_KEY, newTime); // Guardar cada segundo en localStorage
          return newTime;
        } else {
          onTimeUp?.();
          saveToLocalStorage(TIMER_KEY, 0); // Guardar cuando termina
          return 0;
        }
      });
    }, 1000); // Interval of 1 second
    // Cleanup function to clear the interval
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, isMounted, onTimeUp]); // Dependencies array to rerun the effect

  // Calcular minutos y segundos - usar tiempo pausado cuando está pausado
  const minutes = isPaused
    ? Math.floor(pausedSeconds / 60)
    : Math.floor(totalSecondsLeft / 60);
  const seconds = isPaused
    ? pausedSeconds % 60
    : totalSecondsLeft % 60;

  const handleReset = () => {
    console.log('Resetting timer to:', initialMinutes * 60);
    const resetTime = initialMinutes * 60;

    setIsActive(true); // Set the timer as active
    setIsPaused(false); // Set the timer as not paused
    setTotalSecondsLeft(resetTime); // Reset the timer to the original duration
    setPausedSeconds(0); // Limpiar tiempo pausado

    // Guardar en localStorage
    saveToLocalStorage(TIMER_KEY, resetTime);
    saveToLocalStorage(PAUSED_KEY, 0);
    saveToLocalStorage(IS_PAUSED_KEY, false);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onReset?.();
  };

  const handleToggle = () => {
    console.log('Timer toggle clicked, current state:', { isPaused, isActive });
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (isActive && !isPaused) {
      // Pause the timer - guardar tiempo restante en localStorage
      setPausedSeconds(totalSecondsLeft);
      setIsPaused(true);
      saveToLocalStorage(PAUSED_KEY, totalSecondsLeft);
      saveToLocalStorage(IS_PAUSED_KEY, true);
      console.log('Pausado - segundos guardados en localStorage:', totalSecondsLeft);
    } else {
      // Start or resume the timer - restaurar desde localStorage
      const storedPausedSeconds = getFromLocalStorage(PAUSED_KEY, 0);
      if (isPaused && storedPausedSeconds > 0) {
        console.log('Despausado - tiempo restaurado desde localStorage:', storedPausedSeconds);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTotalSecondsLeft(storedPausedSeconds);
        saveToLocalStorage(TIMER_KEY, storedPausedSeconds); // Actualizar tiempo actual en localStorage
      }
      setIsActive(true);
      setIsPaused(false);
      saveToLocalStorage(IS_PAUSED_KEY, false);
    }
    onToggle?.();
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
          title={!isMounted ? "Cargando..." : (isPaused || !isActive ? "Continuar" : "Pausar")}
        >
          {!isMounted ? (
            <PlayIcon width={40} height={40} />
          ) : (isActive && !isPaused ? (
            <PauseIcon width={40} height={40} />
          ) : (
            <PlayIcon width={40} height={40} />
          ))}
        </button>
      </div>
    </div>
  );
};

export default Timer; 