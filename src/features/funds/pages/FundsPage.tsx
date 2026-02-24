import { Link } from 'react-router-dom';
import { Plus, Wallet, AlertCircle } from 'lucide-react';
import { useFundsQuery } from '../hooks/useFunds';
import FundCard from '../components/FundCard';
import FundListSkeleton from '../components/FundListSkeleton';
import EmptyState from '@/components/EmptyState';
import { getMissedCount } from '../utils/fundDateUtils';
import { cn } from '@/lib/utils';

export default function FundsPage() {
  const { data: funds = [], isLoading, error, isError, refetch } = useFundsQuery();

  // Calculate total missed across all funds
  const totalMissed = funds.reduce((sum, fund) => {
    return sum + getMissedCount(fund);
  }, 0);

  // Calculate total invested
  const totalInvested = funds.reduce((sum, fund) => {
    return sum + (fund.payments?.reduce((s, p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
      return s + amount;
    }, 0) || 0);
  }, 0);

  // Show error state
  if (isError) {
    return (
      <div className="animate-fade-in bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
            <div>
              <h1 className="text-xl font-bold">Funds</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Error loading funds</p>
            </div>
            <Link
              to="/funds/new"
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              aria-label="Create new fund"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Error Message */}
        <div className="px-4 pt-8 pb-24 max-w-lg mx-auto">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load funds</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'An error occurred while loading your funds. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-xl font-bold">Funds</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'Loading...' : `${funds.length} active fund${funds.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/funds/new"
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            aria-label="Create new fund"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        {/* Summary Stats - Only show if funds exist */}
        {!isLoading && !isError && funds.length > 0 && (
          <div className="px-4 pb-3 grid grid-cols-3 gap-2 max-w-lg mx-auto">
            <div className="bg-card rounded-lg p-2 border border-border">
              <p className="text-[10px] text-muted-foreground">Funds</p>
              <p className="text-base font-bold">{funds.length}</p>
            </div>
            <div className="bg-card rounded-lg p-2 border border-border">
              <p className="text-[10px] text-muted-foreground">Total Invested</p>
              <p className="text-base font-bold text-primary">
                ₹{totalInvested.toLocaleString('en-IN')}
              </p>
            </div>
            <div className={cn(
              "rounded-lg p-2 border",
              totalMissed > 0
                ? "bg-destructive/10 border-destructive/20"
                : "bg-card border-border"
            )}>
              <p className="text-[10px] text-muted-foreground">Missed</p>
              <p className={cn(
                "text-base font-bold",
                totalMissed > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {totalMissed}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {isLoading ? (
          <FundListSkeleton />
        ) : !isError && funds.length === 0 ? (
          <div className="pt-8">
            <EmptyState
              icon={Wallet}
              title="No funds yet"
              description="Create a recurring fund to start tracking your payments"
              action={
                <Link
                  to="/funds/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Your First Fund
                </Link>
              }
            />
          </div>
        ) : !isError && funds.length > 0 ? (
          <div className="space-y-3">
            {funds.map((fund) => {
              const fundMissed = getMissedCount(fund) > 0;
              return (
                <div
                  key={fund.id}
                  data-missed={fundMissed}
                  className={cn(
                    "transition-all relative",
                    fundMissed && "pl-2"
                  )}
                >
                  {/* Missed indicator line */}
                  {fundMissed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-destructive rounded-r-full" />
                  )}
                  <FundCard fund={fund} />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}