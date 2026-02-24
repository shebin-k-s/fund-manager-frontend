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

export interface CreditCardPayment {
  cycle: string; // "YYYY-MM" (bill month)
  amount: number;
}

export interface CreditCard {
  id: string;
  name: string;
  lastFour: string;
  billDate: number; // 1-31
  dueDate: number; // 1-31
  billingStartDate: string; // yyyy-MM-dd - when billing cycles start
  payments: CreditCardPayment[];
  createdAt: string;
}

export interface BillingCycle {
  cycle: string;
  billDate: Date;
  dueDate: Date;
  isPaid: boolean;
  paidAmount?: number;
}
