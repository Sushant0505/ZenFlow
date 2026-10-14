import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Loads one or more GET endpoints and exposes reload() so pages can refresh after a change.
export function useLoad(paths) {
  const key = paths.join('|');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const results = await Promise.all(key.split('|').map((p) => api(p)));
      setData(results);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
