import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay.
 * Useful for search inputs, filters, and any value that changes rapidly.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 400);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
