import { useState } from 'react';
import { format, isBefore, isAfter } from 'date-fns';
import { Check, X, AlertCircle, Calendar, Clock, ChevronDown, ChevronUp, CreditCardIcon, DollarSign, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickPayment } from './QuickPayment';
import { getBillingCycles } from '../../utils/cardDateUtils';
import { CreditCard } from '../../types';
import { toast } from 'sonner';

interface CardPaymentStatusProps {
  card: CreditCard;
  onPay: (cycle: string, amount: number) => Promise<void> | void;
  onRemove: (cycle: string) => Promise<void> | void;
  isPending?: boolean;
}

export function CardPaymentStatus({
  card,
  onPay,
  onRemove,
  isPending: externalPending
}: CardPaymentStatusProps) {
  const [payingCycle, setPayingCycle] = useState<string | null>(null);
  const [removingCycle, setRemovingCycle] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hidePending, setHidePending] = useState(false);
  const [hideUpcoming, setHideUpcoming] = useState(false);

  if (!card) return null;

  const today = new Date();

  // Get cycles directly from the card data
  const cycles = getBillingCycles(card);

  // Sort cycles by date (newest first)
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

  const handlePaySubmit = async (cycleId: string, amount: number) => {
    await onPay(cycleId, amount);
    setPayingCycle(null);
  };

  const handleRemovePayment = async (cycleId: string) => {
    setRemovingCycle(cycleId);
    try {
      await onRemove(cycleId);
      toast.success('Payment removed successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove payment');
    } finally {
      setRemovingCycle(null);
    }
  };

  const handleCancelPayment = () => {
    setPayingCycle(null);
  };

  // If no cycles at all
  if (totalCycles === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
        <CreditCardIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No billing cycles yet</p>
      </div>
    );
  }

  const isPending = externalPending || removingCycle !== null;

  return (
    <div className="space-y-4">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Total Cycles</p>
          <p className="text-xl font-bold text-white mt-1">{totalCycles}</p>
          <p className="text-xs text-slate-500 mt-1">all time</p>
        </div>

        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
          <div className="flex items-center gap-1 mb-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <p className="text-xs text-slate-400">Paid</p>
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1">{paidCount}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>

        <div className={cn(
          "rounded-xl p-3 border",
          upcomingCount > 0
            ? "bg-blue-500/10 border-blue-500/20"
            : "bg-slate-800/50 border-slate-700"
        )}>
          <div className="flex items-center gap-1 mb-1">
            <Clock className={cn("w-3 h-3", upcomingCount > 0 ? "text-blue-400" : "text-slate-500")} />
            <p className="text-xs text-slate-400">Upcoming</p>
          </div>
          <p className={cn(
            "text-xl font-bold mt-1",
            upcomingCount > 0 ? "text-blue-400" : "text-slate-500"
          )}>
            {upcomingCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">to pay</p>
        </div>

        <div className={cn(
          "rounded-xl p-3 border",
          overdueCount > 0
            ? "bg-red-500/10 border-red-500/20"
            : "bg-slate-800/50 border-slate-700"
        )}>
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className={cn("w-3 h-3", overdueCount > 0 ? "text-red-400" : "text-slate-500")} />
            <p className="text-xs text-slate-400">Overdue</p>
          </div>
          <p className={cn(
            "text-xl font-bold mt-1",
            overdueCount > 0 ? "text-red-400" : "text-slate-500"
          )}>
            {overdueCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {overdueCount > 0 ? 'action needed' : 'all good'}
          </p>
        </div>
      </div>

      {/* Visibility Toggles */}
      {(overdueCycles.length > 0 || upcomingCycles.length > 0) && (
        <div className="flex gap-2">
          {overdueCycles.length > 0 && (
            <button
              onClick={() => setHidePending(!hidePending)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                hidePending
                  ? "bg-slate-800/50 text-slate-400 border border-slate-700"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}
            >
              {hidePending ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hidePending ? 'Show Pending' : 'Hide Pending'}
            </button>
          )}
          {upcomingCycles.length > 0 && (
            <button
              onClick={() => setHideUpcoming(!hideUpcoming)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                hideUpcoming
                  ? "bg-slate-800/50 text-slate-400 border border-slate-700"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              )}
            >
              {hideUpcoming ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hideUpcoming ? 'Show Upcoming' : 'Hide Upcoming'}
            </button>
          )}
        </div>
      )}

      {/* Overdue Section - Only show if not hidden */}
      {overdueCycles.length > 0 && !hidePending && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Overdue Payments ({overdueCycles.length})
          </h3>
          <div className="space-y-2">
            {overdueCycles.map(cycle => {
              const daysOverdue = Math.ceil((today.getTime() - cycle.dueDate.getTime()) / (1000 * 60 * 60 * 24));
              const isPaying = payingCycle === cycle.id;

              if (isPaying) {
                return (
                  <div key={cycle.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <div className="mb-3 pb-2 border-b border-red-500/20">
                      <p className="text-sm font-medium text-white">
                        Paying for: {format(cycle.billDate, 'MMMM yyyy')}
                      </p>
                      <p className="text-xs text-red-400">
                        Due date: {format(cycle.dueDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <QuickPayment
                      cycleId={cycle.id}
                      onSubmit={(amount) => handlePaySubmit(cycle.id, amount)}
                      onCancel={handleCancelPayment}
                      isPending={isPending}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cycle.id}
                  className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <X className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{format(cycle.billDate, 'MMMM yyyy')}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Due {format(cycle.dueDate, 'MMM d, yyyy')}</span>
                        </div>
                        <p className="text-xs text-red-400 font-medium mt-1">
                          {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayingCycle(cycle.id)}
                      disabled={isPending}
                      className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Upcoming Section - Only show if not hidden */}
      {upcomingCycles.length > 0 && !hideUpcoming && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming Payments ({upcomingCycles.length})
          </h3>
          <div className="space-y-2">
            {upcomingCycles.map(cycle => {
              const daysUntilDue = Math.ceil((cycle.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isPaying = payingCycle === cycle.id;

              if (isPaying) {
                return (
                  <div key={cycle.id} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <div className="mb-3 pb-2 border-b border-blue-500/20">
                      <p className="text-sm font-medium text-white">
                        Paying for: {format(cycle.billDate, 'MMMM yyyy')}
                      </p>
                      <p className="text-xs text-blue-400">
                        Due date: {format(cycle.dueDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <QuickPayment
                      cycleId={cycle.id}
                      onSubmit={(amount) => handlePaySubmit(cycle.id, amount)}
                      onCancel={handleCancelPayment}
                      isPending={isPending}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cycle.id}
                  className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{format(cycle.billDate, 'MMMM yyyy')}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Due {format(cycle.dueDate, 'MMM d, yyyy')}</span>
                        </div>
                        <p className="text-xs text-blue-400 font-medium mt-1">
                          {daysUntilDue} days until due
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPayingCycle(cycle.id)}
                      disabled={isPending}
                      className="w-full py-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-emerald-400 mb-1">All Paid Up!</h3>
          <p className="text-sm text-slate-400">
            No pending or overdue payments
          </p>
        </div>
      )}

      {/* Payment History */}
      {paidCycles.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors border border-slate-700"
          >
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Payment History ({paidCycles.length})
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-2 mt-2">
              {paidCycles.slice(0, 5).map(cycle => {
                const payment = card.payments?.find(p => p?.cycle === cycle.id);
                const isRemoving = removingCycle === cycle.id;

                return (
                  <div
                    key={cycle.id}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{format(cycle.billDate, 'MMMM yyyy')}</p>
                            <p className="text-xs text-slate-400 truncate">
                              Paid {payment?.date ? format(new Date(payment.date), 'MMM d, yyyy') : 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">
                          ₹{payment?.amount
                            ? (typeof payment.amount === 'string'
                              ? parseFloat(payment.amount).toLocaleString('en-IN')
                              : payment.amount.toLocaleString('en-IN'))
                            : '0'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemovePayment(cycle.id)}
                        disabled={isPending || isRemoving}
                        className="text-xs text-red-400 hover:text-red-300 self-start disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRemoving ? 'Removing...' : 'Remove payment'}
                      </button>
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