import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import { CreditCard as CCIcon, Landmark, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { CreditCard } from '@/features/credit-cards/types';
import { Fund } from '@/types/finance';
import { useSwipeGesture } from '@/context/SwipeGestureContext';

const gradientClasses = ['cc-gradient-1', 'cc-gradient-2', 'cc-gradient-3', 'cc-gradient-4'];

type DuesTab = 'funds' | 'cards';
const TAB_STORAGE_KEY = 'dashboard-dues-tab';

// Remember the selected tab so coming back from a fund/card keeps it
function loadTab(): DuesTab {
  try {
    return sessionStorage.getItem(TAB_STORAGE_KEY) === 'cards' ? 'cards' : 'funds';
  } catch {
    return 'funds';
  }
}

interface UpcomingDuesProps {
  funds: Array<{ fund: Fund; date: Date }>;
  cards: Array<{ card: CreditCard; cycle: { dueDate: Date } }>;
  today: Date;
  isLoading?: boolean;
}

export function UpcomingDues({ funds, cards, today, isLoading }: UpcomingDuesProps) {
  const [activeTab, setActiveTab] = useState<DuesTab>(loadTab);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const { disableGlobalSwipe, enableGlobalSwipe } = useSwipeGesture();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const scrollCooldown = useRef(false);

  const switchTab = (tab: 'funds' | 'cards', dir: 'left' | 'right') => {
    if (activeTab === tab) return;
    setSlideDirection(dir);
    setActiveTab(tab);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch { /* storage unavailable — tab just won't be remembered */ }
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
                ? 'bg-purple-600/80 text-white shadow-sm'
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

function urgencyClasses(days: number) {
  if (days < 0) return 'bg-destructive/15 text-destructive border-destructive/25';
  if (days <= 1) return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
  if (days <= 7) return 'bg-blue-500/15 text-blue-300 border-blue-500/25';
  return 'bg-white/[0.04] text-white/70 border-white/10';
}

// Days-left tile: the first thing you see is how soon it's due
function Countdown({ days }: { days: number }) {
  return (
    <div className={cn(
      'w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0',
      urgencyClasses(days)
    )}>
      {days === 0 ? (
        <span className="text-[11px] font-extrabold uppercase tracking-wide">Today</span>
      ) : (
        <>
          <span className="text-lg font-bold leading-none">{Math.abs(days)}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5 opacity-80">
            {days < 0 ? 'late' : days === 1 ? 'day' : 'days'}
          </span>
        </>
      )}
    </div>
  );
}

function dueLabel(days: number, date: Date) {
  if (days < 0) return `Was due ${format(date, 'MMM d')}`;
  if (days === 0) return 'Due today';
  if (days === 1) return `Due tomorrow · ${format(date, 'MMM d')}`;
  return `Due ${format(date, 'EEE, MMM d')}`;
}

function DueRow({ to, days, title, meta, date }: {
  to: string; days: number; title: string; meta: React.ReactNode; date: Date;
}) {
  return (
    <Link to={to} className="touch-card p-3 flex items-center gap-3.5 group">
      <Countdown days={days} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[14px] text-white/90 truncate group-hover:text-white transition-colors">{title}</p>
        <p className="text-[12px] text-muted-foreground/80 truncate mt-0.5 flex items-center gap-1.5">
          {meta}
          <span className="opacity-50">·</span>
          <span className={cn(days < 0 && 'text-destructive/90')}>{dueLabel(days, date)}</span>
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

function FundItem({ fund, date, today }: { fund: Fund; date: Date; today: Date }) {
  return (
    <DueRow
      to={`/funds/${fund.id}`}
      days={differenceInCalendarDays(date, today)}
      date={date}
      title={fund.name}
      meta={<span className="font-medium text-white/70">₹{fund.amount.toLocaleString('en-IN')}</span>}
    />
  );
}

function CardItem({ card, cycle, today, index }: { card: CreditCard; cycle: { dueDate: Date }; today: Date; index: number }) {
  const gradient = gradientClasses[index % gradientClasses.length];
  return (
    <DueRow
      to={`/cards/${card.id}`}
      days={differenceInCalendarDays(cycle.dueDate, today)}
      date={cycle.dueDate}
      title={card.name}
      meta={
        <span className="flex items-center gap-1.5 shrink-0">
          <span className={cn('w-4 h-2.5 rounded-[3px]', gradient)} />
          {card.lastFour || '••••'}
        </span>
      }
    />
  );
}

function DuesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="touch-card p-3 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
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
