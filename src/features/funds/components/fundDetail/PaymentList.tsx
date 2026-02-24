import { useState } from 'react';
import { format, isBefore } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentAction } from './PaymentAction';

interface PaymentListProps {
  dates: Date[];
  fund: {
    id: string;
    amount: number;
    payments: Array<{ date: string; amount: number }>;
  };
  today: Date;
  onPay: (dateStr: string) => void;
  onRemove: (dateStr: string) => void;
  isPending?: boolean;
  isLoading?: boolean;
}

export function PaymentList({ 
  dates, 
  fund, 
  today, 
  onPay, 
  onRemove, 
  isPending,
  isLoading 
}: PaymentListProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map(i => (
          <PaymentItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        No payments this month
      </p>
    );
  }

  const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
  const isDatePaid = (date: Date) => 
    fund.payments.some(p => p.date === dateKey(date));
  const getPaidAmount = (date: Date) => 
    fund.payments.find(p => p.date === dateKey(date))?.amount;

  return (
    <div className="space-y-2.5">
      {dates.map(date => {
        const ds = dateKey(date);
        const paid = isDatePaid(date);
        const paidAmt = getPaidAmount(date);
        const overdue = !paid && isBefore(date, today);
        const isActive = activeDate === ds;

        return (
          <div 
            key={ds} 
            className={cn(
              "bg-card rounded-xl border overflow-hidden transition-all",
              overdue ? "border-destructive/40" : "border-border"
            )}
          >
            <button
              onClick={() => setActiveDate(isActive ? null : ds)}
              disabled={isPending}
              className="w-full flex items-center gap-3 p-3.5 disabled:opacity-50 hover:bg-accent/50 transition-colors"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold',
                paid ? 'bg-primary/15 text-primary' :
                overdue ? 'bg-destructive/15 text-destructive' :
                'bg-warning/15 text-warning'
              )}>
                {format(date, 'd')}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{format(date, 'EEEE, MMM d')}</p>
                <p className={cn(
                  "text-xs",
                  overdue ? "text-destructive font-medium" : "text-muted-foreground"
                )}>
                  {paid ? `Paid ₹${paidAmt?.toLocaleString('en-IN')}` :
                   overdue ? '⚠ Missed – Payment overdue!' :
                   'Upcoming'}
                </p>
              </div>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center',
                paid ? 'bg-primary/20' :
                overdue ? 'bg-destructive/20' :
                'bg-secondary'
              )}>
                {paid ? <Check className="w-3.5 h-3.5 text-primary" /> :
                 overdue ? <X className="w-3.5 h-3.5 text-destructive" /> :
                 <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
              </div>
            </button>

            {isActive && (
              <PaymentAction
                date={ds}
                paid={paid}
                amount={fund.amount}
                onPay={() => onPay(ds)}
                onRemove={() => onRemove(ds)}
                isPending={isPending}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentItemSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}