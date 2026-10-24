import apiClient from '@/lib/apiClient';

export interface PfStatus {
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  folderId: string | null;
  folderUrl: string | null;
  lastSyncAt: string | null;
  lastStatus: 'ok' | 'error' | null;
  lastMessage: string | null;
}

export interface PfRecord {
  id: string;
  company: string; // '' when unknown
  month: string; // YYYY-MM
  employeePf: string;
  employerPf: string | null;
  gross: string | null;
  fileName: string | null;
  edited: boolean;
}

export type PfAlert =
  | { type: 'missing'; company: string; from: string; to: string; count: number; trailing: boolean }
  | { type: 'change'; company: string; month: string; previousMonth: string; previous: number; current: number; pct: number };

export interface PfSummary {
  months: number;
  employeeTotal: number;
  employerTotal: number;
  total: number;
  latestMonth: string | null;
  alerts: PfAlert[];
  byCompany: { company: string; employee: number; employer: number; total: number; months: number; from: string; to: string }[];
}

export interface PfRecordInput {
  company: string;
  month: string;
  employeePf: number;
  employerPf: number | null;
  gross: number | null;
}

export interface PfSyncResult {
  found: number;
  added: number;
  updated: number;
  skipped: { fileName: string; reason: string }[];
}

export const pfApi = {
  async status(): Promise<PfStatus> {
    const { data } = await apiClient.get<PfStatus>('/pf/status');
    return data;
  },

  // The Google consent-screen address (read-only Drive access) to send the browser to.
  async connectUrl(): Promise<string> {
    const { data } = await apiClient.post<{ url: string }>('/pf/connect');
    return data.url;
  },

  async disconnect(): Promise<PfStatus> {
    const { data } = await apiClient.post<PfStatus>('/pf/disconnect');
    return data;
  },

  async setFolder(folder: string): Promise<PfStatus> {
    const { data } = await apiClient.put<PfStatus>('/pf/folder', { folder });
    return data;
  },

  // full: read the files already read before again too (hand-edited months are still left alone).
  async sync(full = false): Promise<PfSyncResult> {
    const { data } = await apiClient.post<PfSyncResult>(`/pf/sync${full ? '?full=true' : ''}`, {}, { timeout: 180_000 });
    return data;
  },

  async summary(): Promise<PfSummary> {
    const { data } = await apiClient.get<PfSummary>('/pf/summary');
    return data;
  },

  async records(): Promise<PfRecord[]> {
    const { data } = await apiClient.get<{ records: PfRecord[] }>('/pf/records');
    return data.records;
  },

  async saveRecord(id: string | null, input: PfRecordInput): Promise<PfRecord> {
    const { data } = id ? await apiClient.put<PfRecord>(`/pf/records/${id}`, input) : await apiClient.post<PfRecord>('/pf/records', input);
    return data;
  },

  // Accepts a flagged amount, so it stops raising a "big change" alert.
  async reviewRecord(id: string): Promise<void> {
    await apiClient.post(`/pf/records/${id}/review`);
  },

  async deleteRecord(id: string): Promise<void> {
    await apiClient.delete(`/pf/records/${id}`);
  },
};
