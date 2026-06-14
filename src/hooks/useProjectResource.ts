import { useEffect, useState, useCallback } from 'react';

export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** 通用项目数据 hook：deps 变化或 reload 时调用 load()，按空间隔离由 sc 客户端保证。 */
export function useProjectResource<T>(load: () => Promise<T>, deps: unknown[]): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    load()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(String((e as Error)?.message ?? e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
