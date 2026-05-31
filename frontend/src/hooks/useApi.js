import { useState, useCallback } from 'react';

/**
 * Generic async state hook for API calls.
 * Manages loading, error, and data state.
 *
 * @param {Function} apiFunction - Async function that returns data
 * @returns {{ data, loading, error, execute, reset }}
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(predictDisease);
 *   execute({ cough: 1, fever: 1 });
 */
export default function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const message = err.message || 'An unexpected error occurred.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
