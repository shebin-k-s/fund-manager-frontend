import apiClient from '@/lib/apiClient';
import type {
  Fund,
  CreateFundPayload,
  UpdateFundPayload,
  FundPaymentPayload,
} from '../types';

const FUNDS_URL = '/funds';

export const fundsApi = {
  async getAll(): Promise<Fund[]> {
    const { data } = await apiClient.get<Fund[]>(FUNDS_URL);
    return data;
  },

  async getById(id: string): Promise<Fund> {
    const { data } = await apiClient.get<Fund>(`${FUNDS_URL}/${id}`);
    return data;
  },

  async create(payload: CreateFundPayload): Promise<Fund> {
    const { data } = await apiClient.post<Fund>(FUNDS_URL, payload);
    return data;
  },

  async update({ id, ...payload }: UpdateFundPayload): Promise<Fund> {
    const { data } = await apiClient.put<Fund>(
      `${FUNDS_URL}/${id}`,
      payload
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`${FUNDS_URL}/${id}`);
  },

  async markPaid({
    fundId,
    date,
    amount,
  }: FundPaymentPayload): Promise<Fund> {
    const { data } = await apiClient.post<Fund>(
      `${FUNDS_URL}/${fundId}/payments`,
      { date, amount }
    );
    return data;
  },

  async removePaid({
    fundId,
    date,
  }: {
    fundId: string;
    date: string;
  }): Promise<Fund> {
    const { data } = await apiClient.delete<Fund>(
      `${FUNDS_URL}/${fundId}/payments/${encodeURIComponent(date)}`
    );
    return data;
  },
};