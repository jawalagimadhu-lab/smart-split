/**
 * useBackendSync — generic hook for loading a resource from the backend on mount.
 *
 * Handles demo-token short-circuit, de-duplication, and error silencing
 * so individual pages don't need to repeat boilerplate.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/app/store';

interface Options<T> {
  /** Function that calls the API and returns the data array. */
  fetcher: (token: string) => Promise<T[]>;
  /** Called with the result when the fetch succeeds. */
  onSuccess: (data: T[]) => void;
  /** Whether the store already has data (skip fetch if true and skipIfPopulated is set). */
  hasData?: boolean;
  /** If true, skip the API call when the local store is already populated. */
  skipIfPopulated?: boolean;
  /** Optional: only run when this condition is true. */
  enabled?: boolean;
}

export function useBackendSync<T>({
  fetcher,
  onSuccess,
  hasData = false,
  skipIfPopulated = false,
  enabled = true,
}: Options<T>) {
  const token = useAuthStore(s => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prevent double-fetch in React StrictMode
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!token || token === 'demo-token') return;
    if (skipIfPopulated && hasData) return;
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher(token)
      .then(data => {
        if (!cancelled) onSuccess(data);
      })
      .catch(err => {
        if (!cancelled) setError(err?.message ?? 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled]);

  return { loading, error };
}
