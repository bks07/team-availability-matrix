import { useCallback, useEffect, useRef } from 'react';

const TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart', 'scroll'];

export function useSessionTimeout(isActive: boolean, onTimeout: () => void): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(onTimeout, TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      return;
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }

      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [isActive, resetTimer]);
}
