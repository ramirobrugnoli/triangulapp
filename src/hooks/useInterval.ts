import { useEffect, useRef } from 'react';

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(() => {});
  const interval = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current!();
    }
    if (delay !== null) {
      interval.current = setInterval(tick, delay);
      return () => {
        if (interval.current) {
          clearInterval(interval.current);
        }
      }
    }
  }, [delay]);

  return {
    clear: () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    }
  }
}

export default useInterval; 