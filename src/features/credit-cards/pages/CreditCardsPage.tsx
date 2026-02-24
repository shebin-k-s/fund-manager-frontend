import { Link } from 'react-router-dom';
import { Plus, CreditCard as CCIcon, AlertCircle } from 'lucide-react';
import { useCardsQuery } from '../hooks/useCreditCards';
import CardListSkeleton from '../components/CardListSkeleton';
import EmptyState from '@/components/EmptyState';
import { CardVisual } from '../components/CrediCardDetail/CardVisual';
import { getMissedCardCount } from '../utils/cardDateUtils';
import { cn } from '@/lib/utils';

export default function CreditCardsPage() {
  const { data: cards = [], isLoading, error, isError, refetch } = useCardsQuery();

  // Calculate total overdue across all cards
  const totalOverdue = cards.reduce((sum, card) => {
    return sum + getMissedCardCount(card);
  }, 0);

  // Calculate total paid
  const totalPaid = cards.reduce((sum, card) => {
    return sum + (card.payments?.reduce((s, p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
      return s + amount;
    }, 0) || 0);
  }, 0);

  // Show error state
  if (isError) {
    return (
      <div className="animate-fade-in bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Credit Cards</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Error loading cards</p>
            </div>
            <Link
              to="/cards/new"
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              aria-label="Add new card"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Error Message */}
        <div className="px-4 pt-8 pb-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load cards</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'An error occurred while loading your credit cards. Please try again.'}
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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Credit Cards</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'Loading...' : `${cards.length} card${cards.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/cards/new"
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            aria-label="Add new card"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        {/* Summary Stats - Only show if cards exist */}
        {!isLoading && cards.length > 0 && (
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            <div className="bg-card rounded-lg p-2 border border-border">
              <p className="text-[10px] text-muted-foreground">Cards</p>
              <p className="text-base font-bold">{cards.length}</p>
            </div>
            <div className="bg-card rounded-lg p-2 border border-border">
              <p className="text-[10px] text-muted-foreground">Total Paid</p>
              <p className="text-base font-bold text-primary">
                ₹{totalPaid.toLocaleString('en-IN')}
              </p>
            </div>
            <div className={cn(
              "rounded-lg p-2 border",
              totalOverdue > 0
                ? "bg-destructive/10 border-destructive/20"
                : "bg-card border-border"
            )}>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
              <p className={cn(
                "text-base font-bold",
                totalOverdue > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {totalOverdue}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 pb-6">
        {isLoading ? (
          <CardListSkeleton />
        ) : cards.length === 0 ? (
          <div className="pt-8">
            <EmptyState
              icon={CCIcon}
              title="No credit cards yet"
              description="Add your first credit card to start tracking billing cycles and due dates"
              action={
                <Link
                  to="/cards/new"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Your First Card
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card, index) => {
              const cardOverdue = getMissedCardCount(card) > 0;
              return (
                <div
                  key={card.id}
                  data-overdue={cardOverdue}
                  className={cn(
                    "transition-all relative",
                    cardOverdue && "pl-2"
                  )}
                >
                  {/* Overdue indicator line */}
                  {cardOverdue && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-destructive rounded-r-full" />
                  )}
                  <CardVisual
                    card={card}
                    index={index}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {!isLoading && !isError && cards.length > 0 && (
        <>
          {/* Mobile FAB */}
          <div className="fixed bottom-4 right-4 md:hidden">
            <Link
              to="/cards/new"
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
              aria-label="Add new card"
            >
              <Plus className="w-6 h-6" />
            </Link>
          </div>

          {/* Desktop FAB */}
          <div className="hidden md:block fixed bottom-4 right-4">
            <Link
              to="/cards/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add New Card
            </Link>
          </div>
        </>
      )}
    </div>
  );
}