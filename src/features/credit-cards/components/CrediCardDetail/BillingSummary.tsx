import { useState } from 'react';
import { format, isBefore, isAfter } from 'date-fns';
import { Check, X, AlertCircle, Calendar, Clock, ChevronDown, ChevronUp, CreditCardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickPayment } from './QuickPayment';
import { getBillingCycles } from '../../utils/cardDateUtils';
import { CreditCard } from '../../types';

interface CardPaymentStatusProps {
  card: CreditCard;
  onPay: (cycle: string, amount: number) => void;
  onRemove: (cycle: string) => void;
  isPending?: boolean;
}

export function CardPaymentStatus({
  card,
  onPay,
  onRemove,
  isPending
}: CardPaymentStatusProps) {
  const [payingCycle, setPayingCycle] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (!card) return null;

  const today = new Date();

  // Get cycles directly from the card data
  const cycles = getBillingCycles(card);

  // Sort cycles by date (newest first) - can be done in backend but simple here
  const sortedCycles = [...cycles].sort((a, b) => b.billDate.getTime() - a.billDate.getTime());

  // Separate cycles by status
  const paidCycles = sortedCycles.filter(c => c.isPaid);
  const unpaidCycles = sortedCycles.filter(c => !c.isPaid);

  // Categorize unpaid cycles
  const overdueCycles = unpaidCycles.filter(c => isBefore(c.dueDate, today));
  const upcomingCycles = unpaidCycles.filter(c => isAfter(c.dueDate, today));

  // Calculate totals
  const totalPaid = card.payments?.reduce((sum, p) => {
    const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0) || 0;

  const totalCycles = cycles.length;
  const paidCount = paidCycles.length;
  const overdueCount = overdueCycles.length;
  const upcomingCount = upcomingCycles.length;

  const handlePaySubmit = (cycleId: string, amount: number) => {
    onPay(cycleId, amount);
    setPayingCycle(null);
  };

  // If no cycles at all
  if (totalCycles === 0) {
    return (
      <div className="bg-secondary/30 rounded-xl p-6 text-center">
        <CreditCardIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No billing cycles yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground">Total Cycles</p>
          <p className="text-xl font-bold mt-1">{totalCycles}</p>
          <p className="text-xs text-muted-foreground mt-1">all time</p>
        </div>

        <div className="bg-success/10 rounded-xl p-3 border border-success/20">
          <div className="flex items-center gap-1 mb-1">
            <Check className="w-3 h-3 text-success" />
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <p className="text-xl font-bold text-success mt-1">{paidCount}</p>
          <p className="text-xs text-muted-foreground mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>

        <div className={cn(
          "rounded-xl p-3 border",
          upcomingCount > 0
            ? "bg-warning/10 border-warning/20"
            : "bg-secondary/30 border-border"
        )}>
          <div className="flex items-center gap-1 mb-1">
            <Clock className={cn("w-3 h-3", upcomingCount > 0 ? "text-warning" : "text-muted-foreground")} />
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
          <p className={cn(
            "text-xl font-bold mt-1",
            upcomingCount > 0 ? "text-warning" : "text-muted-foreground"
          )}>
            {upcomingCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">to pay</p>
        </div>

        <div className={cn(
          "rounded-xl p-3 border",
          overdueCount > 0
            ? "bg-destructive/10 border-destructive/20"
            : "bg-secondary/30 border-border"
        )}>
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className={cn("w-3 h-3", overdueCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <p className={cn(
            "text-xl font-bold mt-1",
            overdueCount > 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {overdueCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {overdueCount > 0 ? 'action needed' : 'all good'}
          </p>
        </div>
      </div>

      {/* Overdue Section */}
      {overdueCycles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Overdue Payments ({overdueCycles.length})
          </h3>
          <div className="space-y-2">
            {overdueCycles.map(cycle => {
              const daysOverdue = Math.ceil((today.getTime() - cycle.dueDate.getTime()) / (1000 * 60 * 60 * 24));
              const isPaying = payingCycle === cycle.id;

              if (isPaying) {
                return (
                  <div key={cycle.id} className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                    <QuickPayment
                      cycleId={cycle.id}
                      onSubmit={(amount) => handlePaySubmit(cycle.id, amount)}
                      onCancel={() => setPayingCycle(null)}
                      isPending={isPending}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cycle.id}
                  className="bg-destructive/5 border border-destructive/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{format(cycle.billDate, 'MMMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(cycle.dueDate, 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-destructive font-medium">
                          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayingCycle(cycle.id)}
                      className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingCycles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming Payments ({upcomingCycles.length})
          </h3>
          <div className="space-y-2">
            {upcomingCycles.map(cycle => {
              const daysUntilDue = Math.ceil((cycle.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isPaying = payingCycle === cycle.id;

              if (isPaying) {
                return (
                  <div key={cycle.id} className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                    <QuickPayment
                      cycleId={cycle.id}
                      onSubmit={(amount) => handlePaySubmit(cycle.id, amount)}
                      onCancel={() => setPayingCycle(null)}
                      isPending={isPending}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cycle.id}
                  className="bg-warning/5 border border-warning/20 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">{format(cycle.billDate, 'MMMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {format(cycle.dueDate, 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-warning font-medium">
                          {daysUntilDue} days until due
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayingCycle(cycle.id)}
                      className="px-4 py-2 rounded-lg bg-warning text-warning-foreground text-sm font-medium hover:bg-warning/90 transition-colors"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Caught Up State */}
      {overdueCount === 0 && upcomingCount === 0 && paidCount > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-success" />
          </div>
          <h3 className="font-semibold text-success mb-1">All Paid Up!</h3>
          <p className="text-sm text-muted-foreground">
            No pending or overdue payments
          </p>
        </div>
      )}

      {/* Payment History */}
      {paidCycles.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Payment History ({paidCycles.length})
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-2 mt-2">
              {paidCycles.slice(0, 5).map(cycle => {
                const payment = card.payments?.find(p => p?.cycle === cycle.id);
                return (
                  <div
                    key={cycle.id}
                    className="bg-success/5 border border-success/20 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{format(cycle.billDate, 'MMMM yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid {payment?.date ? format(new Date(payment.date), 'MMM d, yyyy') : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-success">
                          ₹{payment?.amount
                            ? (typeof payment.amount === 'string'
                              ? parseFloat(payment.amount).toLocaleString('en-IN')
                              : payment.amount.toLocaleString('en-IN'))
                            : '0'}
                        </span>
                        <button
                          onClick={() => onRemove(cycle.id)}
                          disabled={isPending}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}