import type { FreshnessStatus } from '@/hooks/useQueryFreshness';

// One dot for a page that loads several queries: refreshing if any is, red if any failed to refresh.
export function combineFreshness(...parts: { status: FreshnessStatus; isFetching: boolean }[]): { status: FreshnessStatus; isFetching: boolean } {
  return {
    isFetching: parts.some((p) => p.isFetching),
    status: parts.some((p) => p.status === 'error') ? 'error' : parts.some((p) => p.status === 'loading') ? 'loading' : 'fresh',
  };
}
