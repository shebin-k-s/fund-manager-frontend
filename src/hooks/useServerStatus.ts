import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

export type ServerStatus = 'live' | 'waking' | 'error';

export function useServerStatus() {
  const { isFetching, isError, status, data } = useQuery({
    queryKey: ['server-health'],
    queryFn: async () => {
      // We'll just ping any small endpoint or the root
      // Since we don't know the exact health endpoint, we'll try a generic one
      // or just assume if this query resolves, it's live.
      try {
        await apiClient.get('/health');
        return 'live';
      } catch (error: any) {
        // If it's a 404 or something, it still means the server responded
        if (error.response) return 'live';
        throw error;
      }
    },
    // Don't refetch too often, but enough to show status
    refetchInterval: 30000, 
    retry: true,
    retryDelay: 2000,
  });

  let serverStatus: ServerStatus = 'live';
  
  if (isFetching && status === 'pending') {
    serverStatus = 'waking';
  } else if (isError) {
    serverStatus = 'error';
  } else {
    serverStatus = 'live';
  }

  return { serverStatus };
}
