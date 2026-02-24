export interface FundPayment {
  date: string; // yyyy-MM-dd
  amount: number;
}

export interface Fund {
  id: string;
  name: string;
  amount: number;
  recurrence: 'weekly' | 'monthly';
  dayOfWeek?: number; // 0=Sun ... 6=Sat
  dayOfMonth?: number; // 1-31
  startDate: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
  payments: FundPayment[];
  createdAt: string;
}

export interface CreateFundPayload {
  name: string;
  amount: number;
  recurrence: 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
}

export interface UpdateFundPayload extends Partial<CreateFundPayload> {
  id: string;
}

export interface FundPaymentPayload {
  fundId: string;
  date: string;
  amount: number;
}
