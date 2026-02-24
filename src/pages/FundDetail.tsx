import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { format, addMonths, subMonths, isBefore, startOfDay, isSameMonth } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import { getFundPaymentDates, isDatePaid, getPaidAmount, dateKey, DAY_NAMES_FULL, getMissedCount } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export default function FundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { funds, setFunds } = useFinance();
  const fund = funds.find(f => f.id === id);

  const [viewMonth, setViewMonth] = useState(new Date());
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!fund) return <Navigate to="/funds" replace />;

  const today = startOfDay(new Date());
  const allDates = getFundPaymentDates(fund);
  const monthDates = allDates.filter(d => isSameMonth(d, viewMonth));
  const totalInvested = fund.payments.reduce((s, p) => s + p.amount, 0);
  const totalPayments = fund.payments.length;
  const missed = getMissedCount(fund);
  const recurrenceLabel = fund.recurrence === 'weekly'
    ? `Every ${DAY_NAMES_FULL[fund.dayOfWeek!]}`
    : `Every ${fund.dayOfMonth}${['st','nd','rd'][((fund.dayOfMonth! % 100) - 20) % 10 - 1] || ['st','nd','rd'][(fund.dayOfMonth! % 100) - 1] || 'th'}`;

  // Month navigation bounds
  const startMonth = allDates.length > 0 ? allDates[0] : new Date();
  const endMonth = allDates.length > 0 ? allDates[allDates.length - 1] : addMonths(new Date(), 2);
  const canGoPrev = viewMonth > startMonth;
  const canGoNext = viewMonth < endMonth;

  const handlePay = (ds: string) => {
    // Use the fund's preset amount - no need to ask
    setFunds(prev => prev.map(f =>
      f.id === fund.id ? { ...f, payments: [...f.payments, { date: ds, amount: fund.amount }] } : f
    ));
    setActiveDate(null);
  };

  const handleRemove = (ds: string) => {
    setFunds(prev => prev.map(f =>
      f.id === fund.id ? { ...f, payments: f.payments.filter(p => p.date !== ds) } : f
    ));
    setActiveDate(null);
  };

  const handleDelete = () => {
    setFunds(prev => prev.filter(f => f.id !== fund.id));
    navigate('/funds');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate('/funds')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{fund.name}</h1>
          <p className="text-xs text-muted-foreground">{recurrenceLabel} · ₹{fund.amount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="page-content">
        {/* Missed Alert */}
        {missed > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">{missed} Missed Payment{missed > 1 ? 's' : ''}</p>
              <p className="text-xs text-destructive/70">You have unpaid dates that are past due</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Invested</p>
            <p className="text-base font-bold text-primary mt-1">₹{totalInvested.toLocaleString('en-IN')}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Payments</p>
            <p className="text-base font-bold mt-1">{totalPayments}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground">Missed</p>
            <p className={cn('text-base font-bold mt-1', missed > 0 ? 'text-destructive' : 'text-primary')}>{missed}</p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
          <button onClick={() => canGoPrev && setViewMonth(m => subMonths(m, 1))} disabled={!canGoPrev}
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center', canGoPrev ? 'bg-secondary' : 'opacity-30')}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">{format(viewMonth, 'MMMM yyyy')}</span>
          <button onClick={() => canGoNext && setViewMonth(m => addMonths(m, 1))} disabled={!canGoNext}
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center', canGoNext ? 'bg-secondary' : 'opacity-30')}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Dates */}
        {monthDates.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No payments this month</p>
        ) : (
          <div className="space-y-2.5">
            {monthDates.map(date => {
              const ds = dateKey(date);
              const paid = isDatePaid(fund, date);
              const paidAmt = getPaidAmount(fund, date);
              const overdue = !paid && isBefore(date, today);
              const isActive = activeDate === ds;

              return (
                <div key={ds} className={cn(
                  "bg-card rounded-xl border overflow-hidden",
                  overdue ? "border-destructive/40" : "border-border"
                )}>
                  <button
                    onClick={() => setActiveDate(isActive ? null : ds)}
                    className="w-full flex items-center gap-3 p-3.5"
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
                      <p className={cn("text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {paid ? `Paid ₹${paidAmt?.toLocaleString('en-IN')}` :
                         overdue ? '⚠ Missed – Payment overdue!' : 'Upcoming'}
                      </p>
                    </div>
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center',
                      paid ? 'bg-primary/20' : overdue ? 'bg-destructive/20' : 'bg-secondary'
                    )}>
                      {paid ? <Check className="w-3.5 h-3.5 text-primary" /> :
                       overdue ? <X className="w-3.5 h-3.5 text-destructive" /> :
                       <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                    </div>
                  </button>

                  {isActive && (
                    <div className="px-3.5 pb-3.5 border-t border-border pt-3">
                      {paid ? (
                        <button
                          onClick={() => handleRemove(ds)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
                        >
                          <X className="w-4 h-4" /> Remove Payment
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(ds)}
                          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium"
                        >
                          Mark as Paid · ₹{fund.amount.toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete */}
        <div className="pt-4">
          {showDeleteConfirm ? (
            <div className="bg-destructive/10 rounded-xl p-4 text-center">
              <p className="text-sm text-destructive mb-3">Delete this fund permanently?</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium">Delete</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive text-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Fund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
