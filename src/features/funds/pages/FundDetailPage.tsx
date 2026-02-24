import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { addMonths, subMonths, isSameMonth, startOfDay, startOfMonth, isAfter, isBefore } from 'date-fns';
import { useFundById, useDeleteFund, useMarkFundPaid, useRemoveFundPayment } from '../hooks/useFunds';
import { getFundPaymentDates, getMissedCount, DAY_NAMES_FULL, dateKey } from '../utils/fundDateUtils';
import { DeleteSection } from '../components/fundDetail/DeleteSection';
import { FundHeader } from '../components/fundDetail/FundHeader';
import { MissedAlert } from '../components/fundDetail/MissedAlert';
import { MonthNavigation } from '../components/fundDetail/MonthNavigation';
import { PaymentList } from '../components/fundDetail/PaymentList';
import { FundStatsCards } from '../components/fundDetail/statsCards';
import type { Fund } from '../types';

export default function FundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: fund, isLoading } = useFundById(id!);
  const deleteFund = useDeleteFund();
  const markPaid = useMarkFundPaid();
  const removePayment = useRemoveFundPayment();

  const [viewMonth, setViewMonth] = useState(new Date());

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-40 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
        </div>
        <div className="page-content space-y-4">
          <div className="h-20 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
          <div className="h-12 bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  // Redirect if fund not found
  if (!fund) {
    return <Navigate to="/funds" replace />;
  }

  const today = startOfDay(new Date());

  // Calculate values
  const allDates = getFundPaymentDates(fund);
  const monthDates = allDates.filter(d => isSameMonth(d, viewMonth));
  const totalInvested = fund.payments?.reduce((s, p) => s + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0) ?? 0;
  const totalPayments = fund.payments?.length ?? 0;
  const missed = getMissedCount(fund);

  const recurrenceLabel = fund.recurrence === 'weekly'
    ? `Every ${DAY_NAMES_FULL[fund.dayOfWeek!]}`
    : `Every ${fund.dayOfMonth}${getDaySuffix(fund.dayOfMonth)}`;

  // Calculate navigation boundaries
  const startBoundary = startOfMonth(new Date(fund.startDate));
  const endBoundary = fund.endDate
    ? startOfMonth(new Date(fund.endDate))
    : startOfMonth(addMonths(new Date(), 12)); // Show up to 12 months in future

  const currentBoundary = startOfMonth(viewMonth);
  const canGoPrev = isAfter(currentBoundary, startBoundary);
  const canGoNext = isBefore(currentBoundary, endBoundary);

  const handlePay = (dateStr: string) => {
    if (fund) {
      markPaid.mutate({ fundId: fund.id, date: dateStr, amount: fund.amount });
    }
  };

  const handleRemove = (dateStr: string) => {
    if (fund) {
      removePayment.mutate({ fundId: fund.id, date: dateStr });
    }
  };

  const handleDelete = () => {
    if (fund) {
      deleteFund.mutate(fund.id, {
        onSuccess: () => navigate('/funds')
      });
    }
  };

  const isPending = markPaid.isPending || removePayment.isPending || deleteFund.isPending;

  return (
    <div className="animate-fade-in">
      <FundHeader
        name={fund.name}
        recurrenceLabel={recurrenceLabel}
        amount={fund.amount}
        fundId={fund.id}
        isLoading={false}
      />

      <div className="page-content">
        <MissedAlert missed={missed} isLoading={false} />

        <FundStatsCards
          invested={totalInvested}
          payments={totalPayments}
          missed={missed}
          isLoading={false}
        />

        <MonthNavigation
          viewMonth={viewMonth}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => setViewMonth(m => subMonths(m, 1))}
          onNext={() => setViewMonth(m => addMonths(m, 1))}
          isLoading={false}
        />

        <PaymentList
          dates={monthDates}
          fund={fund}
          today={today}
          onPay={handlePay}
          onRemove={handleRemove}
          isPending={isPending}
          isLoading={false}
        />

        <DeleteSection onDelete={handleDelete} isPending={deleteFund.isPending} />
      </div>
    </div>
  );
}

// Helper function for day suffix
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}