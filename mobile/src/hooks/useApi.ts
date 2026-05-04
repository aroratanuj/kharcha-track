import { useState, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  retrying: boolean;
  exhausted: boolean;
}

const MAX_RETRIES = 5;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: any): boolean {
  if (!error.config) return false;
  if (error.config.method && !['get', 'GET'].includes(error.config.method)) return false;
  if (error.response) {
    const status = error.response.status;
    if (status >= 400 && status < 500) return false;
    return true;
  }
  return true;
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

  const run = useCallback(async (apiFn: () => Promise<T>) => {
    setState({ data: null, error: null, loading: true, retrying: false, exhausted: false });
    attemptRef.current = 0;

    try {
      const result = await apiFn();
      setState({ data: result, error: null, loading: false, retrying: false, exhausted: false });
      return result;
    } catch (err: any) {
      if (!isRetryableError(err)) {
        const msg = err.response?.data?.message || err.message || 'Something went wrong';
        setState({ data: null, error: msg, loading: false, retrying: false, exhausted: false });
        throw err;
      }

      while (attemptRef.current < MAX_RETRIES) {
        attemptRef.current += 1;
        setState(prev => ({ ...prev, loading: false, retrying: true, error: null }));
        await sleep(Math.pow(2, attemptRef.current) * 1000);

        try {
          const result = await apiFn();
          setState({ data: result, error: null, loading: false, retrying: false, exhausted: false });
          return result;
        } catch (_retryErr) {
          continue;
        }
      }

      const msg = err.response?.data?.message || err.message || 'Request failed after 5 retries';
      setState({ data: null, error: msg, loading: false, retrying: false, exhausted: true });
      throw err;
    }
  }, []);

  const refetch = useCallback(async (apiFn: () => Promise<T>) => {
    attemptRef.current = 0;
    return run(apiFn);
  }, [run]);

  return { ...state, run, refetch };
}
