import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { AxiosError, AxiosRequestConfig } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Generic API fetcher hook with loading, error, and abort controller support.
 * Automatically fetches data on mount when `url` is provided.
 * 
 * @param url - API endpoint to fetch (relative to base URL)
 * @param options - Axios request config
 * @param immediate - Whether to fetch immediately on mount (default: true)
 * 
 * @example
 * const { data, loading, error, refetch } = useApi<Badge[]>('/badges/my-badges/');
 * 
 * @example
 * // Lazy fetch
 * const { data, loading, refetch } = useApi<User>('/auth/me/', {}, false);
 * // Then call refetch() when needed
 */
export function useApi<T>(
  url: string | null,
  options: AxiosRequestConfig = {},
  immediate: boolean = true
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate && !!url,
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.get<T>(url, {
        ...options,
        signal: controller.signal,
      });
      
      // Handle paginated responses
      const data = (response.data as any)?.results !== undefined
        ? (response.data as any).results
        : response.data;
      
      setState({ data: data as T, loading: false, error: null });
    } catch (err) {
      if ((err as any)?.name === 'CanceledError' || (err as any)?.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      
      const axiosError = err as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = axiosError.response?.data?.message 
        || axiosError.response?.data?.error
        || axiosError.message 
        || 'An unexpected error occurred';
      
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [url]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, immediate, fetchData]);

  return { ...state, refetch: fetchData, setData };
}
