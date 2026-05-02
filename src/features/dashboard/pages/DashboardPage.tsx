import { startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { useCardsQuery } from '@/features/credit-cards/hooks/useCreditCards';
import { useFundsQuery } from '@/features/funds/hooks/useFunds';
import { getNextUnpaidDate, getMissedCount } from '@/features/funds/utils/fundDateUtils';
import { getNextUnpaidCycle, getMissedCardCount } from '@/features/credit-cards/utils/cardDateUtils';
import { DashboardEmptyState } from '../components/EmptyState';
import { DashboardHeader } from '../components/Header';
import { MissedPaymentsSection } from '../components/MissedPaymentsSection';
import { StatementDocument } from '@/features/statements/components/StatementDocument';
import { StatsCards } from '../components/Statscards';
import { UpcomingDues } from '../components/UpcomingDues';
import type { CreditCard, BillingCycle } from '@/features/credit-cards/types';
import { Fund } from '@/features/funds/types';
import { DashboardErrorState } from '../components/DashboardErrorState';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { checkAndNotifyDues } = useNotifications();

  const {
    data: funds,
    isLoading: fundsLoading,
    error: fundsError,
    isError: fundsIsError,
    refetch: refetchFunds
  } = useFundsQuery();

  const {
    data: cards,
    isLoading: cardsLoading,
    error: cardsError,
    isError: cardsIsError,
    refetch: refetchCards
  } = useCardsQuery();

  const today = startOfDay(new Date());

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    sessionStorage.clear();

    navigate("/unlock", { replace: true });
  };
  const hasError = fundsIsError || cardsIsError;

  const handleRetry = () => {
    if (fundsIsError) refetchFunds();
    if (cardsIsError) refetchCards();
  };




  // Now it's safe to assume data is valid, but still provide defaults
  const safeFunds = funds || [];
  const safeCards = cards || [];

  // Calculate stats
  const totalFundInvestedCents = safeFunds.reduce(
    (sum, fund) => sum + fund.payments.reduce((a, p) => {
        const amountStr = String(p.amount || 0).replace(/,/g, '');
        const amount = parseFloat(amountStr) || 0;
        return a + Math.round(amount * 100);
    }, 0),
    0
  );
  const totalFundInvested = totalFundInvestedCents / 100;

  const totalCardPaidCents = safeCards.reduce(
    (sum, card) => sum + card.payments.reduce((a, p) => {
        const amountStr = String(p.amount || 0).replace(/,/g, '');
        const amount = parseFloat(amountStr) || 0;
        return a + Math.round(amount * 100);
    }, 0),
    0
  );
  const totalCardPaid = totalCardPaidCents / 100;

  // Calculate missed payments
  const missedFunds = safeFunds
    .map(fund => ({ fund, missed: getMissedCount(fund) }))
    .filter(m => m.missed > 0);

  const missedCards = safeCards
    .map(card => ({ card, missed: getMissedCardCount(card) }))
    .filter(m => m.missed > 0);

  const totalMissed = missedFunds.reduce((s, m) => s + m.missed, 0) +
    missedCards.reduce((s, m) => s + m.missed, 0);

  // Calculate upcoming payments
  const upcomingFunds = safeFunds
    .map(fund => {
      const date = getNextUnpaidDate(fund);
      return date ? { fund, date } : null;
    })
    .filter((item): item is { fund: Fund; date: Date } => item !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const upcomingCards = safeCards
    .map(card => {
      const cycle = getNextUnpaidCycle(card);
      return cycle ? { card, cycle } : null;
    })
    .filter((item): item is { card: CreditCard; cycle: BillingCycle } => item !== null)
    .sort((a, b) => a.cycle.dueDate.getTime() - b.cycle.dueDate.getTime());

  // Check for notifications
  useEffect(() => {
    if (!fundsLoading && !cardsLoading) {
      const allDues: Array<{ id: string, name: string, date: Date, type: 'card' | 'fund' }> = [
        ...upcomingFunds.map(f => ({ id: f.fund.id, name: f.fund.name, date: f.date, type: 'fund' as const })),
        ...upcomingCards.map(c => ({ id: c.card.id, name: c.card.name, date: c.cycle.dueDate, type: 'card' as const }))
      ];
      
      if (allDues.length > 0) {
        checkAndNotifyDues(allDues);
      }
    }
  }, [fundsLoading, cardsLoading, upcomingFunds, upcomingCards, checkAndNotifyDues]);

  const isEmpty = !fundsLoading && !cardsLoading && safeFunds.length === 0 && safeCards.length === 0;

  // Early returns MUST be here, after all hooks!
  if (hasError) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader onLogout={handleLogout} />
        <div className="page-content mt-4">
          <DashboardErrorState
            error={fundsError || cardsError}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  const isLoading = fundsLoading || cardsLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader onLogout={handleLogout} />
        <div className="page-content mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="glass-card p-4 h-[116px] flex flex-col justify-end relative overflow-hidden">
                <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-6 w-24 bg-white/5 mb-1.5 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-emerald-500/50 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 mb-5">
              <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="touch-card p-3.5 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white/5 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3.5 w-32 bg-white/5 mb-2 rounded animate-pulse" />
                    <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader onLogout={handleLogout} />
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <DashboardHeader onLogout={handleLogout} />

      <div className="page-content mt-4">
        <MissedPaymentsSection
          missedFunds={missedFunds}
          missedCards={missedCards}
          totalMissed={totalMissed}
        />

        <StatsCards
          fundsStats={{
            totalInvested: totalFundInvested,
            count: safeFunds.length
          }}
          cardsStats={{
            totalPaid: totalCardPaid,
            count: safeCards.length
          }}
        />

        <UpcomingDues
          funds={upcomingFunds}
          cards={upcomingCards}
          today={today}
        />
      </div>
    </div>
  );
}