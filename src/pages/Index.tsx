import { Link } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { Plus, Wallet, CreditCard as CCIcon, ArrowRight, CalendarClock, AlertTriangle } from 'lucide-react';
import { useFinance } from '@/lib/FinanceContext';
import { getNextUnpaidDate, getNextUnpaidCycle, getMissedCount, getMissedCardCount } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { funds, cards } = useFinance();
  const today = startOfDay(new Date());

  const totalFundInvested = funds.reduce(
    (s, f) => s + f.payments.reduce((a, p) => a + p.amount, 0), 0
  );
  const totalCardPaid = cards.reduce(
    (s, c) => s + c.payments.reduce((a, p) => a + p.amount, 0), 0
  );

  // Missed payments
  const missedFunds = funds.map(f => ({ fund: f, missed: getMissedCount(f) })).filter(m => m.missed > 0);
  const missedCards = cards.map(c => ({ card: c, missed: getMissedCardCount(c) })).filter(m => m.missed > 0);
  const totalMissed = missedFunds.reduce((s, m) => s + m.missed, 0) + missedCards.reduce((s, m) => s + m.missed, 0);

  // Gather upcoming items
  const upcomingFunds = funds
    .map(f => ({ type: 'fund' as const, fund: f, date: getNextUnpaidDate(f) }))
    .filter(u => u.date)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const upcomingCards = cards
    .map(c => ({ type: 'card' as const, card: c, cycle: getNextUnpaidCycle(c) }))
    .filter(u => u.cycle)
    .sort((a, b) => a.cycle!.dueDate.getTime() - b.cycle!.dueDate.getTime());

  const isEmpty = funds.length === 0 && cards.length === 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <p className="text-muted-foreground text-sm">Welcome back 👋</p>
        <h1 className="text-2xl font-bold mt-1">Dashboard</h1>
      </div>

      {isEmpty ? (
        <div className="page-content">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Get Started</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-[240px] mx-auto">
              Add a fund or credit card to start tracking your payments
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/funds/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Fund
              </Link>
              <Link to="/cards/new" className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Card
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="page-content">
          {/* Missed Payments Alert */}
          {totalMissed > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="text-sm font-bold text-destructive">
                  {totalMissed} Missed Payment{totalMissed > 1 ? 's' : ''}
                </h2>
              </div>
              <div className="space-y-2">
                {missedFunds.map(m => (
                  <Link key={m.fund.id} to={`/funds/${m.fund.id}`}
                    className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💰</span>
                      <span className="text-sm font-medium">{m.fund.name}</span>
                    </div>
                    <span className="text-xs font-bold text-destructive bg-destructive/15 px-2 py-1 rounded-md">
                      {m.missed} missed
                    </span>
                  </Link>
                ))}
                {missedCards.map(m => (
                  <Link key={m.card.id} to={`/cards/${m.card.id}`}
                    className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💳</span>
                      <span className="text-sm font-medium">{m.card.name}</span>
                    </div>
                    <span className="text-xs font-bold text-destructive bg-destructive/15 px-2 py-1 rounded-md">
                      {m.missed} overdue
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center mb-2.5">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Fund Invested</p>
              <p className="text-xl font-bold text-primary mt-0.5">₹{totalFundInvested.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-1">{funds.length} active fund{funds.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="stat-card">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center mb-2.5">
                <CCIcon className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground">Cards Paid</p>
              <p className="text-xl font-bold text-warning mt-0.5">₹{totalCardPaid.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground mt-1">{cards.length} card{cards.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Upcoming Fund Payments */}
          {upcomingFunds.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Upcoming Fund Payments</h2>
                <Link to="/funds" className="text-xs text-primary flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {upcomingFunds.slice(0, 3).map(u => {
                  const overdue = isBefore(u.date!, today);
                  return (
                    <Link key={u.fund.id} to={`/funds/${u.fund.id}`} className="touch-card p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-base">💰</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.fund.name}</p>
                        <p className="text-xs text-muted-foreground">₹{u.fund.amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-lg',
                        overdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
                      )}>
                        {overdue ? 'Overdue' : format(u.date!, 'MMM d')}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Card Payments */}
          {upcomingCards.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Card Dues</h2>
                <Link to="/cards" className="text-xs text-primary flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {upcomingCards.slice(0, 3).map(u => {
                  const overdue = isBefore(u.cycle!.dueDate, today);
                  return (
                    <Link key={u.card.id} to={`/cards/${u.card.id}`} className="touch-card p-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center text-base">💳</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.card.name}</p>
                        <p className="text-xs text-muted-foreground">•••• {u.card.lastFour || '••••'}</p>
                      </div>
                      <div className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-lg',
                        overdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
                      )}>
                        {overdue ? 'Overdue' : `Due ${format(u.cycle!.dueDate, 'MMM d')}`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
