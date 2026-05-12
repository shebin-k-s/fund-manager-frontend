import { useFundsQuery } from '@/features/funds/hooks/useFunds';
import { useCardsQuery } from '@/features/credit-cards/hooks/useCreditCards';
import { getFundPaymentDates, dateKey, isDatePaid } from '@/features/funds/utils/fundDateUtils';
import { getBillingCycles } from '@/features/credit-cards/utils/cardDateUtils';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, subMonths, startOfDay, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Landmark, CreditCard, CheckCircle2, Clock, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeGesture } from '@/context/SwipeGestureContext';

export default function CalendarPage() {
    const navigate = useNavigate();
    const { disableGlobalSwipe, enableGlobalSwipe } = useSwipeGesture();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
    const [slideKey, setSlideKey] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('left');

    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const scrollCooldown = useRef(false);

    const goNextMonth = useCallback(() => {
        setDirection('left');
        setSlideKey(k => k + 1);
        setDisplayMonth(m => addMonths(m, 1));
    }, []);

    const goPrevMonth = useCallback(() => {
        setDirection('right');
        setSlideKey(k => k + 1);
        setDisplayMonth(m => subMonths(m, 1));
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Block global tab swipe – calendar card owns this gesture
        disableGlobalSwipe();
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, [disableGlobalSwipe]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) {
            enableGlobalSwipe();
            return;
        }
        const deltaX = touchStartX.current - e.changedTouches[0].clientX;
        const deltaY = touchStartY.current - e.changedTouches[0].clientY;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) goNextMonth(); else goPrevMonth();
        }
        touchStartX.current = null;
        touchStartY.current = null;
        // Restore global swipe after local gesture is resolved
        enableGlobalSwipe();
    }, [goNextMonth, goPrevMonth, enableGlobalSwipe]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Always stop propagation so the global tab-swipe wheel handler
        // never fires while the user is on the Calendar page
        e.stopPropagation();
        if (scrollCooldown.current) return;
        if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            scrollCooldown.current = true;
            if (e.deltaX > 0) goNextMonth(); else goPrevMonth();
            setTimeout(() => { scrollCooldown.current = false; }, 500);
        }
    }, [goNextMonth, goPrevMonth]);


    const { data: funds = [] } = useFundsQuery();
    const { data: cards = [] } = useCardsQuery();

    const dueMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        const rangeEnd = addMonths(startOfDay(new Date()), 6);

        funds.forEach(fund => {
            getFundPaymentDates(fund, rangeEnd).forEach(d => {
                const k = dateKey(d);
                if (!map[k]) map[k] = [];
                map[k].push({ type: 'fund', id: fund.id, name: fund.name, amount: fund.amount, isPaid: isDatePaid(fund, d) });
            });
        });

        cards.forEach(card => {
            getBillingCycles(card, rangeEnd).forEach(c => {
                const k = dateKey(c.dueDate);
                if (!map[k]) map[k] = [];
                map[k].push({ type: 'card', id: card.id, name: card.name, amount: c.paidAmount || 0, isPaid: c.isPaid });
            });
        });

        return map;
    }, [funds, cards]);

    // Stats for header
    const todayKey = dateKey(new Date());
    const allDays = Object.values(dueMap).flat();
    const totalPending = allDays.filter(d => !d.isPaid).length;
    const totalPaid = allDays.filter(d => d.isPaid).length;

    const CustomDay = (props: any) => {
        const k = props.date ? dateKey(props.date) : '';
        const markers = dueMap[k];
        const today = isToday(props.date);
        const isPast = props.date < startOfDay(new Date());

        if (!markers || markers.length === 0) {
            return (
                <div className={cn(
                    "flex flex-col items-center w-full h-full relative pt-1",
                    today ? "font-bold text-white" : "text-white/50"
                )}>
                    <span className="text-[13px]">{props.date.getDate()}</span>
                    {today && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white/70" />}
                </div>
            );
        }

        const allPaid = markers.every(m => m.isPaid);
        const hasOverdue = markers.some(m => !m.isPaid) && isPast;
        
        const pendingFunds = markers.filter(m => m.type === 'fund' && !m.isPaid).length;
        const pendingCards = markers.filter(m => m.type === 'card' && !m.isPaid).length;

        return (
            <div className="flex flex-col items-center justify-center w-full h-full relative p-[2px]">
                <div className={cn(
                    "w-full h-full rounded-lg flex flex-col items-center pt-0.5 relative overflow-hidden transition-all",
                    allPaid ? "bg-emerald-500/10 border border-emerald-500/20" :
                    hasOverdue ? "bg-red-500/10 border border-red-500/20" :
                    "bg-blue-500/10 border border-blue-500/20"
                )}>
                    <span className={cn(
                        "text-[13px] font-bold z-10",
                        allPaid ? "text-emerald-400" :
                        hasOverdue ? "text-red-400" :
                        "text-blue-400"
                    )}>
                        {props.date.getDate()}
                    </span>

                    {today && (
                        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white z-20 shadow-[0_0_5px_white]" />
                    )}

                    <div className="flex gap-1 absolute bottom-1 z-10">
                        {allPaid ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                        ) : (
                            <>
                                {pendingFunds > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.9)]" />
                                )}
                                {pendingCards > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.9)]" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const selectedKey = selectedDate ? dateKey(selectedDate) : '';
    const dayData = dueMap[selectedKey] || [];

    return (
        <div className="animate-fade-in bg-background min-h-full">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-2xl border-b border-white/10 shadow-sm">
                <div className="px-5 pt-5 pb-4 flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-white">Calendar</h1>
                        <p className="text-xs text-muted-foreground mt-0.5 tracking-wider uppercase font-semibold">
                            Payment Schedule
                        </p>
                    </div>

                </div>
            </div>

            <div className="px-4 pt-5 pb-4 max-w-lg mx-auto flex flex-col gap-5">

                {/* Calendar Card */}
                <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/[0.07]"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                >


                    {/* Month nav header */}
                    <div className="bg-[#0d0d0d] px-5 py-3 flex items-center justify-between border-b border-white/[0.06]">
                        <button
                            onClick={goPrevMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white/90 text-sm tracking-wide">
                                {format(displayMonth, 'MMMM yyyy')}
                            </span>
                        </div>
                        <button
                            onClick={goNextMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Calendar grid */}
                    <div className="bg-[#0d0d0d] px-2 pb-3">
                        <div
                            key={slideKey}
                            className={direction === 'left' ? 'animate-slide-from-right' : 'animate-slide-from-left'}
                        >
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                month={displayMonth}
                                onMonthChange={setDisplayMonth}
                                className="w-full"
                                classNames={{
                                    months: "flex flex-col",
                                    month: "space-y-1",
                                    caption: "hidden",           // We use our own header
                                    nav: "hidden",               // We use our own nav
                                    table: "w-full border-collapse",
                                    head_row: "flex mb-1",
                                    head_cell: "flex-1 text-center text-[10px] font-bold uppercase tracking-widest text-white/30 py-2",
                                    row: "flex w-full",
                                    cell: "flex-1 h-11 sm:h-12 p-0.5 relative",
                                    day: "w-full h-full rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5 aria-selected:bg-blue-600/30 aria-selected:border aria-selected:border-blue-500/50 aria-selected:text-white",
                                    day_today: "",
                                    day_outside: "opacity-20",
                                    day_disabled: "opacity-20",
                                    day_selected: "bg-blue-600/30 border border-blue-500/50 text-white hover:bg-blue-600/40",
                                    day_range_middle: "",
                                    day_range_end: "",
                                    day_hidden: "invisible",
                                }}
                                components={{ DayContent: CustomDay }}
                            />
                        </div>
                    </div>

                    {/* Legend strip */}
                    <div className="bg-[#0a0a0a] border-t border-white/[0.06] px-2 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.9)]" />
                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Fund</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.9)]" />
                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Card</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Paid</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                                <span className="w-1 h-1 rounded-full bg-red-500" />
                            </div>
                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Missed</span>
                        </div>
                    </div>
                </div>

                {/* Selected date panel */}
                <div className="w-full">
                    {/* Date heading */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-1 h-4 rounded-full bg-blue-500/70" />
                        <h3 className="text-sm font-bold text-white/90">
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Select a date'}
                        </h3>
                        {selectedDate && isToday(selectedDate) && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                Today
                            </span>
                        )}
                    </div>

                    {dayData.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-8 flex flex-col items-center text-center gap-2 bg-white/[0.02]">
                            <CalendarDays className="w-8 h-8 text-white/10" />
                            <p className="text-sm text-white/30 font-medium">No payments on this day</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {dayData.map((data: any, i: number) => {
                                const isPaid = data.isPaid;
                                const isFund = data.type === 'fund';

                                const accentColor = isPaid
                                    ? 'text-emerald-400'
                                    : isFund ? 'text-blue-400' : 'text-amber-400';
                                const bgColor = isPaid
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : isFund ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20';
                                const dotGlow = isPaid
                                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                    : isFund ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';

                                return (
                                    <div
                                        key={i}
                                        onClick={() => navigate(`/${isFund ? 'funds' : 'cards'}/${data.id}`)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                                            "bg-white/[0.03] border-white/[0.06]",
                                            "hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                            bgColor
                                        )}>
                                            {isFund
                                                ? <Landmark className={cn("w-4.5 h-4.5", accentColor)} />
                                                : <CreditCard className={cn("w-4.5 h-4.5", accentColor)} />
                                            }
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white/90 truncate">{data.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                    dotGlow
                                                )} />
                                                <p className={cn("text-[10px] uppercase tracking-widest font-bold", accentColor)}>
                                                    {data.type} · {isPaid ? 'Paid' : 'Pending'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount badge */}
                                        {(data.amount > 0 || isFund) && (
                                            <div className={cn(
                                                "flex flex-col items-end shrink-0 px-3 py-2 rounded-xl border",
                                                bgColor
                                            )}>
                                                {isPaid && (
                                                    <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-500/60 mb-0.5">Paid</span>
                                                )}
                                                <span className={cn("text-sm font-mono font-bold tabular-nums", accentColor)}>
                                                    ₹{(data.amount || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
