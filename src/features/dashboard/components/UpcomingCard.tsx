import { Link } from 'react-router-dom';
import { format, isBefore } from 'date-fns';
import { CreditCard as CCIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { CreditCard } from '@/features/credit-cards/types';

interface UpcomingCardsProps {
  cards: Array<{ card: CreditCard; cycle: { dueDate: Date } }>;
  today: Date;
  isLoading?: boolean;
}

const gradientClasses = [
    'cc-gradient-1',
    'cc-gradient-2',
    'cc-gradient-3',
    'cc-gradient-4',
];

export function UpcomingCards({ cards, today, isLoading }: UpcomingCardsProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-white/80 rounded-full" />
          <h2 className="text-[15px] font-bold tracking-tight text-white/95">Card Dues</h2>
        </div>
        {!isLoading && cards.length > 0 && (
          <Link to="/cards" className="text-[10px] uppercase font-bold tracking-wider text-white/50 hover:text-white transition-colors">
            See All
          </Link>
        )}
      </div>

      {isLoading ? (
        <UpcomingCardsSkeleton />
      ) : cards.length > 0 ? (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          {cards.map(({ card, cycle }, index) => (
            <UpcomingCardItem key={card.id} card={card} cycle={cycle} today={today} index={index} />
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
  index: number;
}

function UpcomingCardItem({ card, cycle, today, index }: UpcomingCardItemProps) {
  const overdue = isBefore(cycle.dueDate, today);
  const gradient = gradientClasses[index % gradientClasses.length];
  
  return (
    <Link 
      to={`/cards/${card.id}`} 
      className="touch-card p-3.5 flex items-center gap-3.5 group"
    >
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white/80 shadow-md group-hover:scale-110 transition-transform duration-300 relative overflow-hidden", gradient)}>
        <CCIcon className="w-5 h-5 z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-white/90 truncate transition-colors group-hover:text-white">{card.name}</p>
        <p className="text-[12px] font-medium text-muted-foreground/80">
          •••• {card.lastFour || '••••'}
        </p>
      </div>
      <div className={cn(
        'text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-[0.5rem] whitespace-nowrap',
        overdue ? 'bg-destructive/10 text-destructive' : 'bg-white/5 text-white/70'
      )}>
        {overdue ? 'Overdue' : `Due ${format(cycle.dueDate, 'MMM d')}`}
      </div>
    </Link>
  );
}

function UpcomingCardsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="touch-card p-3.5 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-1.5" />
            <div className="h-2.5 w-20 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}