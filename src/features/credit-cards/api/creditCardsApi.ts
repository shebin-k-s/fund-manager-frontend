import apiClient from '@/lib/apiClient';
import type { CreditCard, CreateCardPayload, UpdateCardPayload, CardPaymentPayload } from '../types';

const CARDS_URL = '/credit-cards';

export const creditCardsApi = {
  getAll: () =>
    apiClient.get<CreditCard[]>(CARDS_URL).then(res => res.data),

  getById: (id: string) =>
    apiClient.get<CreditCard>(`${CARDS_URL}/${id}`).then(res => res.data),

  create: (payload: CreateCardPayload) =>
    apiClient.post<CreditCard>(CARDS_URL, payload).then(res => res.data),

  update: ({ id, ...payload }: UpdateCardPayload) =>
    apiClient.put<CreditCard>(`${CARDS_URL}/${id}`, payload).then(res => res.data),

  delete: (id: string) =>
    apiClient.delete(`${CARDS_URL}/${id}`).then(res => res.data),

  markPaid: ({ cardId, cycle, amount }: CardPaymentPayload) =>
    apiClient.post<CreditCard>(`${CARDS_URL}/${cardId}/payments`, { cycle, amount }).then(res => res.data),

  removePaid: ({ cardId, cycle }: { cardId: string; cycle: string }) =>
    apiClient.delete<CreditCard>(`${CARDS_URL}/${cardId}/payments/${cycle}`).then(res => res.data),
};
