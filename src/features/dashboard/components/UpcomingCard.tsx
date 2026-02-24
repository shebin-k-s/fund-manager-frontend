import { Link } from 'react-router-dom';
import { format, isBefore } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { CreditCard } from '@/features/credit-cards/types';

interface UpcomingCardsProps {
  cards: Array<{ card: CreditCard; cycle: { dueDate: Date } }>;
  today: Date;
  isLoading?: boolean;
}

export function UpcomingCards({ cards, today, isLoading }: UpcomingCardsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Card Dues</h2>
        {!isLoading && cards.length > 0 && (
          <Link to="/cards" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <UpcomingCardsSkeleton />
      ) : cards.length > 0 ? (
        <div className="space-y-2.5">
          {cards.slice(0, 3).map(({ card, cycle }) => (
            <UpcomingCardItem key={card.id} card={card} cycle={cycle} today={today} />
          ))}
        </div>
      ) : (
        <EmptyState message="No upcoming card dues" />
      )}
    </div>
  );
}

interface UpcomingCardItemProps {
  card: CreditCard;
  cycle: { dueDate: Date };
  today: Date;
}

function UpcomingCardItem({ card, cycle, today }: UpcomingCardItemProps) {
  const overdue = isBefore(cycle.dueDate, today);
  
  return (
    <Link 
      to={`/cards/${card.id}`} 
      className="touch-card p-3.5 flex items-center gap-3 hover:bg-accent/50 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center text-base">
        💳
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{card.name}</p>
        <p className="text-xs text-muted-foreground">
          •••• {card.lastFour || '••••'}
        </p>
      </div>
      <div className={cn(
        'text-xs font-medium px-2.5 py-1 rounded-lg',
        overdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
      )}>
        {overdue ? 'Overdue' : `Due ${format(cycle.dueDate, 'MMM d')}`}
      </div>
    </Link>
  );
}

function UpcomingCardsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="touch-card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/15 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}