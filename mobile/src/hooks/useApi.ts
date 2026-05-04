import { useState, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  retrying: boolean;
  exhausted: boolean;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
    retrying: false,
    exhausted: false,
  });

  const attemptRef = useRef(0);

  const run = useCallback(async (apiFn: () => Promise<T>, attempt = 0) => {
    if (attempt === 0) {
      setState({ data: null, error: null, loading: true, retrying: false, exhausted: false });
      attemptRef.current = 0;
    } else {
      setState(prev => ({ ...prev, retrying: true, error: null }));
      attemptRef.current = attempt;
    }

    try {
      const result = await apiFn();
      setState({ data: result, error: null, loading: false, retrying: false, exhausted: false });
      return result;
    } catch (err: any) {
      if (err.__exhaustedRetries) {
        const msg = err.response?.data?.message || err.message || 'Request failed after 5 retries';
        setState({ data: null, error: msg, loading: false, retrying: false, exhausted: true });
        throw err;
      }

      if (attempt > 0) {
        setState(prev => ({ ...prev, retrying: false }));
      } else {
        const msg = err.response?.data?.message || err.message || 'Something went wrong';
        setState({ data: null, error: msg, loading: false, retrying: false, exhausted: false });
      }
      throw err;
    }
  }, []);

  const refetch = useCallback(async (apiFn: () => Promise<T>) => {
    attemptRef.current = 0;
    return run(apiFn, 0);
  }, [run]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, exhausted: false }));
  }, []);

  return { ...state, run, refetch, clearError };
}
