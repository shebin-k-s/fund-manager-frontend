import { startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useCardsQuery } from '@/features/credit-cards/hooks/useCreditCards';
import { useFundsQuery } from '@/features/funds/hooks/useFunds';
import { getNextUnpaidDate, getMissedCount } from '@/features/funds/utils/fundDateUtils';
import { getNextUnpaidCycle, getMissedCardCount } from '@/features/credit-cards/utils/cardDateUtils';
import { DashboardEmptyState } from '../components/EmptyState';
import { DashboardHeader } from '../components/Header';
import { MissedPaymentsSection } from '../components/MissedPaymentsSection';
import { StatsCards } from '../components/Statscards';
import { UpcomingCards } from '../components/UpcomingCard';
import { UpcomingFunds } from '../components/UpcomingFunds';
import type { CreditCard, BillingCycle } from '@/features/credit-cards/types';
import { Fund } from '@/features/funds/types';
import { DashboardErrorState } from '../components/DashboardErrorState';
import apiClient from '@/lib/apiClient';

export default function DashboardPage() {
  const navigate = useNavigate();

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
  const handleLogout = async () => {

    localStorage.clear();

    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    sessionStorage.clear();

    navigate('/unlock', { replace: true });

  };

  const hasError = fundsIsError || cardsIsError;

  const handleRetry = () => {
    if (fundsIsError) refetchFunds();
    if (cardsIsError) refetchCards();
  };

  if (hasError) {
    return (
      <div className="animate-fade-in">
        <DashboardHeader onLogout={handleLogout} />
        <div className="page-content">
          <DashboardErrorState
            error={fundsError || cardsError}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  // Now it's safe to assume data is valid, but still provide defaults
  const safeFunds = funds || [];
  const safeCards = cards || [];

  // Calculate stats
  const totalFundInvested = safeFunds.reduce(
    (sum, fund) => sum + fund.payments.reduce((a, p) => a + Number(p.amount), 0),
    0
  );

  const totalCardPaid = safeCards.reduce(
    (sum, card) => sum + card.payments.reduce((a, p) => a + Number(p.amount), 0),
    0
  );

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

  const isEmpty = !fundsLoading && !cardsLoading && safeFunds.length === 0 && safeCards.length === 0;

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

      <div className="page-content">
        <MissedPaymentsSection
          missedFunds={missedFunds}
          missedCards={missedCards}
          totalMissed={totalMissed}
          isLoading={fundsLoading || cardsLoading}
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
          isLoading={{
            funds: fundsLoading,
            cards: cardsLoading
          }}
        />

        <UpcomingFunds
          funds={upcomingFunds}
          today={today}
          isLoading={fundsLoading}
        />

        <UpcomingCards
          cards={upcomingCards}
          today={today}
          isLoading={cardsLoading}
        />
      </div>
    </div>
  );
}