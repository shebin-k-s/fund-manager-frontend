export interface CreditCardPayment {
  cycle: string; // "YYYY-MM" (bill month)
  amount: number;
}





export interface CreateCardPayload {
  name: string;
  lastFour: string;
  billDate: number;
  dueDate: number;
  billingStartDate: string;
}

export interface UpdateCardPayload extends Partial<CreateCardPayload> {
  id: string;
}

export interface CardPaymentPayload {
  cardId: string;
  cycle: string;
  amount: number;
}

// types.ts
export interface BillingCycle {
  id: string;
  cycle: string;
  billDate: Date;
  dueDate: Date;
  isPaid: boolean;
  paidAmount?: number;
  paidDate?: Date;
  // Computed properties
  status: 'paid' | 'overdue' | 'upcoming' | 'pending';
  daysUntilDue?: number;
  isOverdue: boolean;
  isUpcoming: boolean;
  month: string;
  shortMonth: string;
}

export interface CreditCard {
  id: string;
  name: string;
  lastFour?: string;
  billDate: number;
  dueDate: number;
  billingStartDate?: string;
  createdAt: string;
  payments: Array<{
    cycle: string;
    amount: number;
    date: string;
  }>;
}