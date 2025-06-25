import { create } from 'zustand';

const MATCH_DURATION = 7 * 60; // 7 minutes in seconds

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  worker: Worker | null;
  actions: {
    initialize: () => void;
    start: () => void;
    pause: () => void;
    reset: () => void;
    setTime: (time: number) => void;
    cleanup: () => void;
  };
}

const useTimerStore = create<TimerState>((set, get) => ({
  timeLeft: MATCH_DURATION,
  isRunning: false,
  worker: null,
  actions: {
    initialize: () => {
      // Evitar inicializar el worker en el servidor
      if (typeof window === 'undefined' || get().worker) return;

      const worker = new Worker('/timer-worker.js');

      worker.onmessage = (e) => {
        const { type, timeLeft } = e.data;
        if (type === 'tick') {
          set({ timeLeft });
        } else if (type === 'done') {
          set({ isRunning: false });
        }
      };
      
      worker.postMessage({ command: 'setTime', value: get().timeLeft });
      set({ worker });
    },
    start: () => {
      get().worker?.postMessage({ command: 'start' });
      set({ isRunning: true });
    },
    pause: () => {
      get().worker?.postMessage({ command: 'pause' });
      set({ isRunning: false });
    },
    reset: () => {
        get().worker?.postMessage({ command: 'setTime', value: MATCH_DURATION });
        set({ timeLeft: MATCH_DURATION, isRunning: false });
    },
    setTime: (time) => {
        get().worker?.postMessage({ command: 'setTime', value: time });
        set({ timeLeft: time });
    },
    cleanup: () => {
      get().worker?.terminate();
      set({ worker: null });
    },
  },
}));

export const useTimerActions = () => useTimerStore((state) => state.actions);
export const useTimeLeft = () => useTimerStore((state) => state.timeLeft);
export const useIsTimerRunning = () => useTimerStore((state) => state.isRunning);

// Initialize worker as soon as the app loads on the client
if (typeof window !== 'undefined') {
    useTimerStore.getState().actions.initialize();
}
