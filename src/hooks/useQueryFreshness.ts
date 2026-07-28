import { useEffect, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

export type FreshnessStatus = 'loading' | 'fresh' | 'error';

interface FreshnessInfo {
  status: FreshnessStatus;
  isFetching: boolean;
}

/**
 * Tracks query freshness: loading while fetching, error when the last
 * fetch attempt failed (e.g. offline) even though stale cached data is
 * still being shown, fresh otherwise.
 *
 * `isPaused` must be treated as an error too — with the default
 * networkMode ('online'), React Query doesn't error a fetch when the
 * browser is offline, it just pauses it (fetchStatus: 'paused'), so
 * isError alone never flips and the dot would stay green while offline.
 */
export function useQueryFreshness(query: UseQueryResult<any, unknown>): FreshnessInfo {
  const [status, setStatus] = useState<FreshnessStatus>('fresh');

  useEffect(() => {
    setStatus(query.isFetching ? 'loading' : (query.isError || query.isPaused) ? 'error' : 'fresh');
  }, [query.isFetching, query.isError, query.isPaused]);

  return {
    status,
    isFetching: query.isFetching,
  };
}
