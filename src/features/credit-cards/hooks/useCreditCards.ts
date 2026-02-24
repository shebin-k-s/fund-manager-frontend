import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditCardsApi } from '../api/creditCardsApi';
import type {
  CreateCardPayload,
  UpdateCardPayload,
  CardPaymentPayload,
  CreditCard,
} from '../types';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { toast } from 'sonner'; // or your toast library

const CARDS_KEY = ['creditCards'] as const;

/* ===========================
   GET ALL CARDS
=========================== */

export function useCardsQuery() {
  return useQuery<CreditCard[], Error>({
    queryKey: CARDS_KEY,
    queryFn: creditCardsApi.getAll,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCardById(id: string) {
  return useQuery<CreditCard | undefined, Error>({
    queryKey: [...CARDS_KEY, id],
    queryFn: async () => {
      if (!id) return undefined;
      return creditCardsApi.getById(id);
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

/* ===========================
   CREATE CARD
=========================== */

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation<CreditCard, Error, CreateCardPayload>({
    mutationFn: creditCardsApi.create,

    onSuccess: (data) => {
      // Update the list cache with the new card
      queryClient.setQueryData<CreditCard[]>(CARDS_KEY, (old = []) => {
        return [...old, data];
      });

      // Also set the individual card cache
      queryClient.setQueryData([...CARDS_KEY, data.id], data);

      toast.success('Card created successfully');
    },

    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Create Card Error:', message);
      toast.error(message || 'Failed to create card');
    },
  });
}

/* ===========================
   UPDATE CARD
=========================== */

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation<CreditCard, Error, UpdateCardPayload>({
    mutationFn: creditCardsApi.update,

    onSuccess: (data, variables) => {
      // Update the individual card in cache
      queryClient.setQueryData([...CARDS_KEY, variables.id], data);

      // Update the card in the list cache
      queryClient.setQueryData<CreditCard[]>(CARDS_KEY, (old = []) => {
        return old.map(card => card.id === variables.id ? data : card);
      });

      toast.success('Card updated successfully');
    },

    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Update Card Error:', message);
      toast.error(message || 'Failed to update card');
    },
  });
}

/* ===========================
   DELETE CARD
=========================== */

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: creditCardsApi.delete,

    onSuccess: (_, cardId) => {
      // Remove the individual card from cache
      queryClient.removeQueries({ queryKey: [...CARDS_KEY, cardId] });

      // Update the list cache
      queryClient.setQueryData<CreditCard[]>(CARDS_KEY, (old = []) => {
        return old.filter(card => card.id !== cardId);
      });

      toast.success('Card deleted successfully');
    },

    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Delete Card Error:', message);
      toast.error(message || 'Failed to delete card');
    },
  });
}

/* ===========================
   MARK CARD PAID
=========================== */

export function useMarkCardPaid() {
  const queryClient = useQueryClient();

  return useMutation<CreditCard, Error, CardPaymentPayload>({
    mutationFn: creditCardsApi.markPaid,

    onSuccess: (data, variables) => {
      console.log('Payment successful:', data);

      // IMPORTANT: Ensure we have the card ID
      const cardId = data?.id || variables.cardId;

      if (!cardId) {
        console.error('No card ID found in response or variables');
        toast.error('Payment recorded but failed to update cache');
        return;
      }

      // Update the specific card in cache with the returned data
      queryClient.setQueryData([...CARDS_KEY, cardId], data);

      // Update the card in the list cache
      queryClient.setQueryData<CreditCard[]>(CARDS_KEY, (old = []) => {
        return old.map(card => card.id === cardId ? data : card);
      });

      // Also invalidate to ensure consistency (optional but safe)
      queryClient.invalidateQueries({
        queryKey: [...CARDS_KEY, cardId],
        refetchType: 'none' // Don't auto refetch, just mark as stale
      });

      toast.success('Payment recorded successfully');
    },

    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Mark Card Paid Error:', message);
      toast.error(message || 'Failed to record payment');
    },
  });
}

/* ===========================
   REMOVE CARD PAYMENT
=========================== */

export function useRemoveCardPayment() {
  const queryClient = useQueryClient();

  return useMutation<
    CreditCard,
    Error,
    { cardId: string; cycle: string }
  >({
    mutationFn: creditCardsApi.removePaid,

    onSuccess: (data, variables) => {
      console.log('Remove payment successful:', data);

      // IMPORTANT: Ensure we have the card ID
      const cardId = data?.id || variables.cardId;

      if (!cardId) {
        console.error('No card ID found in response or variables');
        toast.error('Payment removed but failed to update cache');
        return;
      }

      // Update the specific card in cache
      queryClient.setQueryData([...CARDS_KEY, cardId], data);

      // Update the card in the list cache
      queryClient.setQueryData<CreditCard[]>(CARDS_KEY, (old = []) => {
        return old.map(card => card.id === cardId ? data : card);
      });

      toast.success('Payment removed successfully');
    },

    onError: (error) => {
      const message = getErrorMessage(error);
      console.error('Remove Card Payment Error:', message);
      toast.error(message || 'Failed to remove payment');
    },
  });
}