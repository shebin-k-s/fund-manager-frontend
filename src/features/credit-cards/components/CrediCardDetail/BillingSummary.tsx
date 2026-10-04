import { useState } from 'react';
import { format, isBefore, isAfter, startOfDay, differenceInCalendarDays, addDays, getDaysInMonth } from 'date-fns';
import { Check, AlertCircle, Clock, ChevronDown, CreditCardIcon, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickPayment } from './QuickPayment';
import { getBillingCycles } from '../../utils/cardDateUtils';
import { CreditCard } from '../../types';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface CardPaymentStatusProps {
  card: CreditCard;
  onPay: (cycle: string, amount: number, paidAt?: string) => Promise<void> | void;
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
  const [confirmCycle, setConfirmCycle] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hidePending, setHidePending] = useState(false);
  const [hideUpcoming, setHideUpcoming] = useState(false);

  if (!card) return null;

  const today = startOfDay(new Date());

  // Get cycles directly from the card data
  const cycles = getBillingCycles(card);

  // Sort cycles by date (newest first)
  const sortedCycles = [...cycles].sort((a, b) => b.billDate.getTime() - a.billDate.getTime());

  // Separate cycles by status
  const paidCycles = sortedCycles.filter(c => c.isPaid);
  const unpaidCycles = sortedCycles.filter(c => !c.isPaid);

  // Categorize unpaid cycles
  const overdueCycles = unpaidCycles.filter(c => isBefore(c.dueDate, today));
  const upcomingCycles = unpaidCycles.filter(c => !isBefore(c.dueDate, today) && !isAfter(c.billDate, today));

  const totalPaidCents = card.payments?.reduce((sum, p) => {
    const amountStr = String(p.amount || 0).replace(/,/g, '');
    const amount = parseFloat(amountStr) || 0;
    return sum + Math.round((isNaN(amount) ? 0 : amount) * 100);
  }, 0) || 0;
  const totalPaid = totalPaidCents / 100;

  const totalCycles = cycles.length;
  const paidCount = paidCycles.length;
  const overdueCount = overdueCycles.length;
  const upcomingCount = upcomingCycles.length;

  const handlePaySubmit = async (cycleId: string, amount: number, paidAt?: string) => {
    await onPay(cycleId, amount, paidAt);
    setPayingCycle(null);
  };

  const handleRemovePayment = async (cycleId: string) => {
    setRemovingCycle(cycleId);
    try {
      await onRemove(cycleId);
    } finally {
      setRemovingCycle(null);
      setConfirmCycle(null);
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

  const renderDueList = (kind: 'overdue' | 'upcoming', list: typeof overdueCycles) => {
    const isOverdue = kind === 'overdue';
    return (
      <div className="space-y-2">
        <p className={cn(
          'text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 px-1',
          isOverdue ? 'text-red-400' : 'text-blue-400'
        )}>
          {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {isOverdue ? 'Overdue' : 'Upcoming'} · {list.length}
        </p>

        <div className={cn(
          'rounded-2xl border overflow-hidden divide-y',
          isOverdue
            ? 'bg-red-500/[0.04] border-red-500/20 divide-red-500/10'
            : 'bg-card/80 border-white/5 divide-white/5'
        )}>
          {list.map(cycle => {
            const days = differenceInCalendarDays(cycle.dueDate, today);
            const isPaying = payingCycle === cycle.id;
            const status = isOverdue
              ? `${-days} day${-days !== 1 ? 's' : ''} overdue`
              : days === 0 ? 'Due today' : `Due in ${days} day${days !== 1 ? 's' : ''}`;

            return (
              <div key={cycle.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{cyclePeriod(cycle.cycle, card.billDate)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {format(cycle.dueDate, 'MMM d')}
                      <span> · </span>
                      <span className={isOverdue ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-blue-400'}>
                        {status}
                      </span>
                    </p>
                  </div>
                  {!isPaying && (
                    <button
                      onClick={() => setPayingCycle(cycle.id)}
                      disabled={isPending}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                        isOverdue
                          ? 'bg-red-500 text-white hover:bg-red-500/90'
                          : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25'
                      )}
                    >
                      Pay
                    </button>
                  )}
                </div>

                {isPaying && (
                  <div className="mt-3">
                    <QuickPayment
                      cycleId={cycle.id}
                      onSubmit={(amount, paidAt) => handlePaySubmit(cycle.id, amount, paidAt)}
                      onCancel={handleCancelPayment}
                      isPending={isPending}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      {overdueCycles.length > 0 && !hidePending && renderDueList('overdue', overdueCycles)}

      {/* Upcoming Section - Only show if not hidden */}
      {upcomingCycles.length > 0 && !hideUpcoming && renderDueList('upcoming', upcomingCycles)}

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
      {card.payments && card.payments.length > 0 && (() => {
        const dueByCycle = new Map(cycles.map(c => [c.cycle, c.dueDate]));
        const history = [...card.payments].sort((a, b) => {
          if (a.cycle !== b.cycle) return b.cycle.localeCompare(a.cycle);
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        // Group by the year of the bill (the cycle's year)
        const historyByYear: Array<{ year: string; payments: typeof history }> = [];
        for (const p of history) {
          const year = p.cycle.slice(0, 4);
          const group = historyByYear[historyByYear.length - 1];
          if (group?.year === year) group.payments.push(p);
          else historyByYear.push({ year, payments: [p] });
        }
        const totalHistoryPaid = history.reduce(
          (sum, p) => sum + (parseFloat(String(p.amount || 0).replace(/,/g, '')) || 0),
          0
        );

        return (
          <div className="pt-2 space-y-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full stat-card p-4 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Payment History
                </p>
                <p className="text-sm text-white mt-1">
                  {history.length} payment{history.length !== 1 ? 's' : ''}
                  <span className="text-muted-foreground"> · </span>
                  ₹{formatRupees(totalHistoryPaid)} paid
                </p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showHistory && 'rotate-180')} />
            </button>

            {showHistory && (
              <div className="space-y-3">
                {historyByYear.map(({ year, payments }) => (
                  <div key={year} className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground px-1">{year}</p>
                    <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-md overflow-hidden divide-y divide-white/5">
                      {payments.map((payment, index) => {
                        const isRemoving = removingCycle === payment.cycle;
                        const paidOn = payment.date ? new Date(payment.date) : null;
                        const due = dueByCycle.get(payment.cycle);
                        const daysLate = paidOn && due ? differenceInCalendarDays(paidOn, due) : null;
                        const amount = parseFloat(String(payment.amount || 0).replace(/,/g, '')) || 0;

                        return (
                          <div key={`${payment.cycle}-${index}`} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">
                                {cyclePeriod(payment.cycle, card.billDate, false)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {paidOn ? `Paid ${format(paidOn, 'MMM d')}` : 'Paid'}
                                {daysLate !== null && (
                                  <>
                                    <span> · </span>
                                    <span className={daysLate > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                      {paidVsDue(daysLate)}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-white tabular-nums">
                              ₹{formatRupees(amount)}
                            </p>
                            <button
                              onClick={() => setConfirmCycle(payment.cycle)}
                              disabled={isPending || isRemoving}
                              className="w-8 h-8 -mr-1.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                              title="Remove payment"
                            >
                              {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
      <ConfirmDialog
        open={confirmCycle !== null}
        onCancel={() => setConfirmCycle(null)}
        onConfirm={() => confirmCycle && handleRemovePayment(confirmCycle)}
        isPending={removingCycle !== null}
        title="Remove this payment?"
        description={confirmCycle && `The ${cyclePeriod(confirmCycle, card.billDate)} bill will be marked as unpaid again.`}
        confirmLabel="Remove"
        pendingLabel="Removing..."
      />
    </div>
  );
}


// Whole rupees without decimals, otherwise always 2 places (₹12,340.50)
function formatRupees(value: number): string {
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

// Statement period a cycle covers: the day after last month's bill date up
// to this month's bill date, e.g. "Jul 13 – Aug 12" (year added when not this year)
function cyclePeriod(cycleId: string, billDay: number, withYear = true): string {
  const [y, m] = cycleId.split('-').map(Number);
  const billOn = (year: number, month: number) =>
    new Date(year, month, Math.min(billDay, getDaysInMonth(new Date(year, month))));
  const end = billOn(y, m - 1);
  const start = addDays(billOn(y, m - 2), 1);
  const thisYear = new Date().getFullYear();

  if (!withYear || (end.getFullYear() === thisYear && start.getFullYear() === thisYear)) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
  }
  return start.getFullYear() === end.getFullYear()
    ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    : `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

function paidVsDue(daysLate: number): string {
  if (daysLate > 0) return `${daysLate} day${daysLate !== 1 ? 's' : ''} late`;
  if (daysLate === 0) return 'on due date';
  return `${-daysLate} day${daysLate !== -1 ? 's' : ''} early`;
}
