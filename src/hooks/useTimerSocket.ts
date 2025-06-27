import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  whistleHasPlayed: boolean;
  gameId: string;
}

interface UseTimerSocketProps {
  gameId: string;
  onTimeUp?: () => void;
  onWhistle?: () => void;
}

export function useTimerSocket({ gameId, onTimeUp, onWhistle }: UseTimerSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 7 * 60, // 7 minutos por defecto
    isRunning: false,
    whistleHasPlayed: false,
    gameId
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io({
      path: '/api/timer/socket'
    });

    newSocket.on('connect', () => {
      console.log('Connected to timer socket');
      setIsConnected(true);
      newSocket.emit('join-game', gameId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from timer socket');
      setIsConnected(false);
    });

    newSocket.on('timer-state', (state: TimerState) => {
      setTimerState(state);
    });

    newSocket.on('time-up', () => {
      if (onTimeUp) {
        onTimeUp();
      }
    });

    newSocket.on('whistle-time', () => {
      if (onWhistle) {
        onWhistle();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, onTimeUp, onWhistle]);

  const startTimer = useCallback(() => {
    if (socket) {
      socket.emit('start-timer', gameId);
    }
  }, [socket, gameId]);

  const stopTimer = useCallback(() => {
    if (socket) {
      socket.emit('stop-timer', gameId);
    }
  }, [socket, gameId]);

  const resetTimer = useCallback(() => {
    if (socket) {
      socket.emit('reset-timer', gameId);
    }
  }, [socket, gameId]);

  const resetWhistle = useCallback(() => {
    if (socket) {
      socket.emit('reset-whistle', gameId);
    }
  }, [socket, gameId]);

  const toggleTimer = useCallback(() => {
    if (timerState.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  }, [timerState.isRunning, startTimer, stopTimer]);

  return {
    timerState,
    isConnected,
    startTimer,
    stopTimer,
    resetTimer,
    resetWhistle,
    toggleTimer
  };
} 