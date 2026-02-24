import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fundsApi } from '../api/fundsApi';
import type {
  CreateFundPayload,
  UpdateFundPayload,
  FundPaymentPayload,
  Fund,
} from '../types';
import { getErrorMessage } from '@/utils/getErrorMessage';

const FUNDS_KEY = ['funds'] as const;

/* ===========================
   GET ALL FUNDS
=========================== */

export function useFundsQuery() {
  return useQuery<Fund[], Error>({
    queryKey: FUNDS_KEY,
    queryFn: fundsApi.getAll,
    staleTime: 30_000,
    retry: 1,
  });
}

/* ===========================
   GET FUND BY ID
=========================== */

export function useFundById(id: string) {
  return useQuery<Fund, Error>({
    queryKey: [...FUNDS_KEY, id],
    queryFn: () => fundsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

/* ===========================
   CREATE FUND
=========================== */

export function useCreateFund() {
  const qc = useQueryClient();

  return useMutation<Fund, Error, CreateFundPayload>({
    mutationFn: fundsApi.create,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FUNDS_KEY });
    },

    onError: (error) => {
      console.error('Create Fund Error:', getErrorMessage(error));
    },
  });
}

/* ===========================
   UPDATE FUND
=========================== */

export function useUpdateFund() {
  const qc = useQueryClient();

  return useMutation<Fund, Error, UpdateFundPayload>({
    mutationFn: fundsApi.update,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FUNDS_KEY });
    },

    onError: (error) => {
      console.error('Update Fund Error:', getErrorMessage(error));
    },
  });
}

/* ===========================
   DELETE FUND
=========================== */

export function useDeleteFund() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: fundsApi.delete,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FUNDS_KEY });
    },

    onError: (error) => {
      console.error('Delete Fund Error:', getErrorMessage(error));
    },
  });
}

/* ===========================
   MARK FUND PAID
=========================== */

export function useMarkFundPaid() {
  const qc = useQueryClient();

  return useMutation<Fund, Error, FundPaymentPayload>({
    mutationFn: fundsApi.markPaid,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FUNDS_KEY });
    },

    onError: (error) => {
      console.error('Mark Paid Error:', getErrorMessage(error));
    },
  });
}



export function useRemoveFundPayment() {
  const qc = useQueryClient();

  return useMutation<
    Fund,
    Error,
    { fundId: string; date: string }
  >({
    mutationFn: fundsApi.removePaid,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FUNDS_KEY });
    },

    onError: (error) => {
      console.error('Remove Payment Error:', getErrorMessage(error));
    },
  });
}