import { useEffect, useRef, useCallback } from 'react';

/**
 * Polling hook that repeatedly calls a fetcher function at a given interval
 * while a condition is true. Automatically cleans up on unmount.
 * 
 * @param fetcher - Async function to call on each interval
 * @param interval - Polling interval in milliseconds
 * @param enabled - Whether polling is active
 * 
 * @example
 * // Poll for resume processing status every 3 seconds
 * usePolling(
 *   async () => {
 *     const updated = await getMyResume();
 *     setResume(updated);
 *     if (updated.parsing_status === 'completed') return false; // stop polling
 *     return true; // continue polling
 *   },
 *   3000,
 *   resume?.parsing_status === 'processing'
 * );
 */
export function usePolling(
  fetcher: () => Promise<boolean | void>,
  interval: number,
  enabled: boolean
): void {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const stop = useCallback(() => {}, []);

  useEffect(() => {
    if (!enabled) return;

    let timer: number | undefined;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const shouldContinue = await fetcherRef.current();
        if (shouldContinue === false) {
          active = false;
          return;
        }
      } catch {
        // Stop polling on error
        active = false;
        return;
      }
      if (active) {
        timer = window.setTimeout(poll, interval);
      }
    };

    // Start after initial delay
    timer = window.setTimeout(poll, interval);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [interval, enabled]);
}
