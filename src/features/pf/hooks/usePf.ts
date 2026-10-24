import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pfApi, type PfRecordInput } from '../api/pfApi';
import { getErrorMessage } from '@/utils/getErrorMessage';

const PF_KEY = ['pf'] as const;

// Connection status changes outside the app (the Google sign-in happens on another site), so it is
// always re-checked when the page opens.
export function usePfStatus() {
  return useQuery({ queryKey: [...PF_KEY, 'status'], queryFn: pfApi.status, staleTime: 0, refetchOnMount: 'always' });
}

export function usePfSummary() {
  return useQuery({ queryKey: [...PF_KEY, 'summary'], queryFn: pfApi.summary });
}

export function usePfRecords() {
  return useQuery({ queryKey: [...PF_KEY, 'records'], queryFn: pfApi.records });
}

export function useConnectPfDrive() {
  return useMutation({
    mutationFn: async () => {
      window.location.replace(await pfApi.connectUrl());
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDisconnectPfDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pfApi.disconnect,
    onSuccess: (status) => {
      qc.setQueryData([...PF_KEY, 'status'], status);
      toast.success('Google Drive disconnected');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSetPfFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pfApi.setFolder,
    onSuccess: (status) => {
      qc.setQueryData([...PF_KEY, 'status'], status);
      toast.success('Payslip folder saved');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePfSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (full: boolean) => pfApi.sync(full),
    onSuccess: (r) => {
      toast.success(`Read ${r.found} payslip${r.found === 1 ? '' : 's'}: ${r.added} added, ${r.updated} updated`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => qc.invalidateQueries({ queryKey: PF_KEY }),
  });
}

export function useSavePfRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: PfRecordInput }) => pfApi.saveRecord(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PF_KEY });
      toast.success('PF record saved');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeletePfRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pfApi.deleteRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PF_KEY });
      toast.success('PF record deleted');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReviewPfRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pfApi.reviewRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PF_KEY });
      toast.success('Marked as reviewed');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
