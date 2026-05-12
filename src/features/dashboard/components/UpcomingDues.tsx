import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, isBefore } from 'date-fns';
import { CreditCard as CCIcon, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { CreditCard } from '@/features/credit-cards/types';
import { Fund } from '@/types/finance';
import { useSwipeGesture } from '@/context/SwipeGestureContext';

const gradientClasses = ['cc-gradient-1', 'cc-gradient-2', 'cc-gradient-3', 'cc-gradient-4'];

interface UpcomingDuesProps {
  funds: Array<{ fund: Fund; date: Date }>;
  cards: Array<{ card: CreditCard; cycle: { dueDate: Date } }>;
  today: Date;
  isLoading?: boolean;
}

export function UpcomingDues({ funds, cards, today, isLoading }: UpcomingDuesProps) {
  const [activeTab, setActiveTab] = useState<'funds' | 'cards'>('funds');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const { disableGlobalSwipe, enableGlobalSwipe } = useSwipeGesture();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const scrollCooldown = useRef(false);

  const switchTab = (tab: 'funds' | 'cards', dir: 'left' | 'right') => {
    if (activeTab === tab) return;
    setSlideDirection(dir);
    setActiveTab(tab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    disableGlobalSwipe();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      enableGlobalSwipe();
      return;
    }
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) switchTab('cards', 'left'); else switchTab('funds', 'right');
    }

    touchStartX.current = null;
    touchStartY.current = null;
    enableGlobalSwipe();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (scrollCooldown.current) return;
    if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      scrollCooldown.current = true;
      if (e.deltaX > 0) switchTab('cards', 'left'); else switchTab('funds', 'right');
      setTimeout(() => { scrollCooldown.current = false; }, 500);
    }
  };

  return (
    <div
      className="glass-card p-5 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-emerald-500/80 rounded-full" />
        <h2 className="text-[15px] font-bold tracking-tight text-white/95">Upcoming Dues</h2>
      </div>

      {/* Tab header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => switchTab('funds', 'right')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              activeTab === 'funds'
                ? 'bg-blue-600/80 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Landmark className="w-3.5 h-3.5" />
            Fund Dues
            {!isLoading && funds.length > 0 && (
              <span className={cn(
                'ml-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-bold',
                activeTab === 'funds' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
              )}>
                {funds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => switchTab('cards', 'left')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              activeTab === 'cards'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <CCIcon className="w-3.5 h-3.5" />
            Card Dues
            {!isLoading && cards.length > 0 && (
              <span className={cn(
                'ml-0.5 text-[10px] rounded-full px-1.5 py-0.5 font-bold',
                activeTab === 'cards' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
              )}>
                {cards.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        key={activeTab}
        className={cn(
          "animate-in fade-in duration-300 fill-mode-both",
          slideDirection === 'left' ? "slide-in-from-right-8" : "slide-in-from-left-8"
        )}
      >
        {isLoading ? (
          <DuesSkeleton />
        ) : activeTab === 'funds' ? (
          funds.length > 0 ? (
            <div className="space-y-3">
              {funds.map(({ fund, date }) => (
                <FundItem key={fund.id} fund={fund} date={date} today={today} />
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming fund payments" />
          )
        ) : (
          cards.length > 0 ? (
            <div className="space-y-3">
              {cards.map(({ card, cycle }, index) => (
                <CardItem key={card.id} card={card} cycle={cycle} today={today} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming card dues" />
          )
        )}
      </div>
    </div>
  );
}

function FundItem({ fund, date, today }: { fund: Fund; date: Date; today: Date }) {
  const overdue = isBefore(date, today);
  return (
    <Link to={`/funds/${fund.id}`} className="touch-card p-3.5 flex items-center gap-3.5 group">
      <div className="w-11 h-11 rounded-xl bg-blue-900/40 border border-blue-800/50 flex items-center justify-center text-blue-200/90 group-hover:scale-110 shadow-sm transition-transform duration-300">
        <Landmark className="w-5 h-5 drop-shadow-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-white/90 truncate transition-colors group-hover:text-white">{fund.name}</p>
        <p className="text-[12px] font-medium text-muted-foreground/80">₹{fund.amount.toLocaleString('en-IN')}</p>
      </div>
      <div className={cn(
        'text-[10px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-[0.5rem] whitespace-nowrap',
        overdue ? 'bg-destructive/10 text-destructive' : 'bg-blue-900/30 text-blue-300/80'
      )}>
        {overdue ? 'Overdue' : format(date, 'MMM d')}
      </div>
    </Link>
  );
}

function CardItem({ card, cycle, today, index }: { card: CreditCard; cycle: { dueDate: Date }; today: Date; index: number }) {
  const overdue = isBefore(cycle.dueDate, today);
  const gradient = gradientClasses[index % gradientClasses.length];
  return (
    <Link to={`/cards/${card.id}`} className="touch-card p-3.5 flex items-center gap-3.5 group">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white/80 shadow-md group-hover:scale-110 transition-transform duration-300 relative overflow-hidden', gradient)}>
        <CCIcon className="w-5 h-5 z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-white/90 truncate transition-colors group-hover:text-white">{card.name}</p>
        <p className="text-[12px] font-medium text-muted-foreground/80">•••• {card.lastFour || '••••'}</p>
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

function DuesSkeleton() {
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
