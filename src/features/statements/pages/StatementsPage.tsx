import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSwipeGesture } from '@/context/SwipeGestureContext';
import { useNavigate } from 'react-router-dom';
import { useFundsQuery } from '@/features/funds/hooks/useFunds';
import { useCardsQuery } from '@/features/credit-cards/hooks/useCreditCards';
import { getFundPaymentDates, isDatePaid, getPaidAmount } from '@/features/funds/utils/fundDateUtils';
import { getBillingCycles } from '@/features/credit-cards/utils/cardDateUtils';
import { DynamicStatementDocument } from '../components/DynamicStatementDocument';
import { exportStatementToPdf } from '../utils/exportToPdf';
import { StatementRow } from '../types';
import { addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format } from 'date-fns';
import { FileText, Filter, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, LayoutList, CalendarDays, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatementsPage() {
    const navigate = useNavigate();
    const { disableGlobalSwipe, enableGlobalSwipe } = useSwipeGesture();
    const { data: funds = [] } = useFundsQuery();
    const { data: cards = [] } = useCardsQuery();

    const [viewMode, setViewMode] = useState<'month' | 'entity'>('month');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const [slideKey, setSlideKey] = useState(0);

    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const scrollCooldown = useRef(false);

    const switchToEntity = useCallback(() => {
        if (viewMode === 'entity') return;
        setSlideDirection('left');
        setSlideKey(k => k + 1);
        setViewMode('entity');
    }, [viewMode]);

    const switchToMonth = useCallback(() => {
        if (viewMode === 'month') return;
        setSlideDirection('right');
        setSlideKey(k => k + 1);
        setViewMode('month');
    }, [viewMode]);

    const mountCooldown = useRef(true);
    useEffect(() => {
        const timer = setTimeout(() => { mountCooldown.current = false; }, 700);
        return () => clearTimeout(timer);
    }, []);

    const processSwipe = useCallback((isNext: boolean) => {
        if (mountCooldown.current) return;
        if (isNext) {
            if (viewMode === 'month') switchToEntity();
        } else {
            if (viewMode === 'entity') switchToMonth();
            else navigate('/calendar');
        }
    }, [viewMode, switchToEntity, switchToMonth, navigate]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Block global tab swipe – StatementsPage owns all horizontal swipes
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
            processSwipe(deltaX > 0);
        }
        touchStartX.current = null;
        touchStartY.current = null;
        // Restore global swipe after local gesture is resolved
        enableGlobalSwipe();
    }, [processSwipe, enableGlobalSwipe]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Always stop propagation so the global tab-swipe wheel handler
        // never fires while the user is on the Statements page
        e.stopPropagation();
        if (scrollCooldown.current || mountCooldown.current) return;
        if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            scrollCooldown.current = true;
            processSwipe(e.deltaX > 0);
            setTimeout(() => { scrollCooldown.current = false; }, 500);
        }
    }, [processSwipe]);


    // Sub-filters
    const [subType, setSubType] = useState<'all' | 'fund' | 'card'>('all');

    // Scopes
    const [activeMonthKey, setActiveMonthKey] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM'));
    const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
    const [activeEntityId, setActiveEntityId] = useState<string>('');
    const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

    // Calculate available years for selection slider (Current + 5 past years)
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 6 }, (_, i) => currentYear - i);
    }, []);

    // Static 12 months for the month slider
    const monthOptionsList = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
    }, []);



    // Generate entity options
    const entityOptions = useMemo(() => {
        const options: { id: string; name: string; type: 'fund' | 'card' }[] = [];
        funds.forEach(f => options.push({ id: `fund-${f.id}`, name: f.name, type: 'fund' }));
        cards.forEach(c => options.push({ id: `card-${c.id}`, name: c.name, type: 'card' }));
        return options;
    }, [funds, cards]);

    if (viewMode === 'entity' && !activeEntityId && entityOptions.length > 0) {
        setActiveEntityId(entityOptions[0].id);
    }

    // Derive current active metrics directly from string
    const activeYearStr = activeMonthKey.split('-')[0];
    const activeMonthStr = activeMonthKey.split('-')[1];

    const activeMonthStart = startOfMonth(new Date(parseInt(activeYearStr), parseInt(activeMonthStr) - 1, 1));
    const activeMonthEnd = endOfMonth(activeMonthStart);

    // Compute base rows depending on time scope and entity selection
    const finalRows: StatementRow[] = useMemo(() => {
        const rows: StatementRow[] = [];
        const now = new Date();

        const addFundRows = (fund: any, start?: Date, end?: Date) => {
            const boundary = end || now; // Cap entity views cleanly to Today if unbound to prevent future spam
            const dates = getFundPaymentDates(fund, boundary);
            const validDates = start && end ? dates.filter(d => isWithinInterval(d, { start, end })) : dates;
            validDates.forEach(date => {
                const isPaid = isDatePaid(fund, date);
                rows.push({
                    id: `fund-${fund.id}-${date.getTime()}`, entityId: fund.id, type: 'fund', name: fund.name, dueDate: date, isPaid,
                    amount: isPaid ? Number(getPaidAmount(fund, date) || fund.amount) : Number(fund.amount)
                });
            });
        };

        const addCardRows = (card: any, start?: Date, end?: Date) => {
            const boundary = end || now; // Cap entity views cleanly to Today
            const cycles = getBillingCycles(card, boundary);
            // Filter card billing cycles by their Bill Generation Date, not when they are Due!
            const validCycles = start && end ? cycles.filter(c => isWithinInterval(c.billDate, { start, end })) : cycles;
            validCycles.forEach(c => {
                const prevBillDate = addMonths(c.billDate, -1);
                // e.g. "15 Mar to 15 Apr '26 (Due 05 May)"
                const dateLabel = `${format(prevBillDate, 'dd MMM')} to ${format(c.billDate, 'dd MMM yy')} (Due ${format(c.dueDate, 'dd MMM')})`;

                rows.push({
                    id: `card-${card.id}-${c.cycle}`, entityId: card.id, type: 'card', name: card.name, dueDate: c.dueDate, isPaid: c.isPaid,
                    amount: c.isPaid ? Number(c.paidAmount !== undefined ? c.paidAmount : 0) : Number(c.paidAmount || 0),
                    dateLabel
                });
            });
        };

        if (viewMode === 'month') {
            if (subType === 'all' || subType === 'fund') funds.forEach(f => addFundRows(f, activeMonthStart, activeMonthEnd));
            if (subType === 'all' || subType === 'card') cards.forEach(c => addCardRows(c, activeMonthStart, activeMonthEnd));
        } else if (viewMode === 'entity' && activeEntityId) {
            const [type, ...idParts] = activeEntityId.split('-');
            const rawId = idParts.join('-');
            if (type === 'fund') { const f = funds.find(f => f.id === rawId); if (f) addFundRows(f); }
            if (type === 'card') { const c = cards.find(c => c.id === rawId); if (c) addCardRows(c); }
        }

        return rows.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    }, [funds, cards, viewMode, subType, activeMonthKey, activeEntityId]);

    // Calculate Summary Metrics
    const metrics = useMemo(() => {
        let paid = 0, pending = 0, overdue = 0;
        const now = new Date();
        finalRows.forEach(r => {
            const amt = Number(r.amount) || 0;
            if (r.isPaid) { paid += amt; }
            else if (r.dueDate < now) { overdue += amt; }
            else { pending += amt; }
        });
        return { paid, pending, overdue };
    }, [finalRows]);

    const displayLabel = viewMode === 'month' ? format(activeMonthStart, 'MMMM yyyy') :
        (entityOptions.find(e => e.id === activeEntityId)?.name || 'Entity Statement');

    const handleExport = () => {
        const safeName = displayLabel.replace(/[^a-z0-9]/gi, '_');
        exportStatementToPdf('dynamic-statement-container', `Statement_${safeName}`);
    };

    return (
        <div
            className="animate-fade-in bg-background absolute inset-0 flex flex-col overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >

            {/* ── Header: filters ── */}
            <div className="relative z-50 shrink-0 bg-background/95 border-b border-white/5 pt-5 pb-3 px-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            Statements
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5 tracking-wider uppercase font-semibold">Advanced Reporting</p>
                    </div>
                    <button onClick={handleExport} title="Export Current View to PDF" className="h-9 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-semibold hidden sm:inline">Export PDF</span>
                    </button>
                </div>

                <div className="max-w-lg mx-auto mt-4 flex flex-col gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-[#111] rounded-xl border border-white/5 p-1">
                        <button onClick={switchToMonth} className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all", viewMode === 'month' ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5")}>Month View</button>
                        <button onClick={switchToEntity} className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all", viewMode === 'entity' ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5")}>Entity View</button>
                    </div>
                    <div
                        key={slideKey}
                        className={cn(
                            "flex flex-col gap-3 animate-in fade-in duration-300 fill-mode-both",
                            slideDirection === 'left' ? "slide-in-from-right-8" : "slide-in-from-left-8"
                        )}
                    >
                        {/* Sub-filter chips — month mode only */}
                        {viewMode !== 'entity' && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSubType('all')} className={cn("px-4 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0", subType === 'all' ? "bg-white text-black" : "border border-white/10 text-gray-400 hover:text-white")}>All</button>
                                <button onClick={() => setSubType('fund')} className={cn("px-4 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0", subType === 'fund' ? "bg-blue-500 text-white" : "border border-white/10 text-gray-400 hover:text-white")}>Funds</button>
                                <button onClick={() => setSubType('card')} className={cn("px-4 py-1.5 text-xs font-semibold rounded-full transition-all shrink-0", subType === 'card' ? "bg-purple-500 text-white" : "border border-white/10 text-gray-400 hover:text-white")}>Cards</button>
                            </div>
                        )}

                        {/* Contextual Nav Row: Primary filter dependent on mode */}
                        <div>
                            {viewMode === 'month' ? (
                                <div className="flex flex-col gap-2">
                                    {/* Month Dropdown Trigger */}
                                    <button
                                        onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                                        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-[#111] py-3.5 pl-4 pr-4 transition-all hover:bg-white/5 focus:border-emerald-500/50 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CalendarIcon className="w-5 h-5 text-emerald-500" />
                                            <span className="text-sm font-semibold tracking-wide text-white">
                                                {format(activeMonthStart, 'MMMM yyyy')}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", isMonthSelectorOpen && "rotate-180")} />
                                    </button>

                                    <div className={cn(
                                        "grid transition-all duration-300 ease-in-out",
                                        isMonthSelectorOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                                    )}>
                                        <div className="overflow-hidden">
                                            <div className="flex flex-col gap-2 bg-[#111] rounded-xl border border-white/5 p-3 mt-2">
                                                {/* Year Selector */}
                                                <div
                                                    className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                                    onTouchStart={e => e.stopPropagation()}
                                                    onWheel={e => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center gap-1.5 px-0.5 w-max">
                                                        {yearOptions.map(y => (
                                                            <button
                                                                key={y}
                                                                onClick={() => setActiveMonthKey(`${y}-${activeMonthStr}`)}
                                                                className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0", activeYearStr === y.toString() ? "bg-white/10 text-white border border-white/20" : "bg-transparent text-gray-500 hover:text-white")}
                                                            >
                                                                {y}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Month Selector */}
                                                <div
                                                    className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                                    onTouchStart={e => e.stopPropagation()}
                                                    onWheel={e => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center gap-2 px-1 w-max">
                                                        {monthOptionsList.map(m => {
                                                            const monthStr = m.toString().padStart(2, '0');
                                                            const monthLabel = format(new Date(2024, m - 1, 1), 'MMM'); // 'Jan', 'Feb'
                                                            return (
                                                                <button
                                                                    key={m}
                                                                    onClick={() => setActiveMonthKey(`${activeYearStr}-${monthStr}`)}
                                                                    className={cn("px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0", activeMonthStr === monthStr ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-[#141414] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white")}
                                                                >
                                                                    {monthLabel}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Custom Dropdown Trigger */}
                                    <button
                                        onClick={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                                        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-[#111] py-3.5 pl-4 pr-4 transition-all hover:bg-white/5 focus:border-emerald-500/50 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Filter className="w-5 h-5 text-emerald-500" />
                                            <span className={cn("text-sm font-semibold tracking-wide", activeEntityId ? "text-white" : "text-gray-400")}>
                                                {activeEntityId
                                                    ? (entityOptions.find(e => e.id === activeEntityId)?.name || 'Select Entity')
                                                    : "Select Entity"}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", isEntityDropdownOpen && "rotate-180")} />
                                    </button>

                                    {/* Custom Dropdown Menu Overlay */}
                                    {isEntityDropdownOpen && (
                                        <>
                                            {/* Invisible backdrop to dismiss click outside */}
                                            <div className="fixed inset-0 z-40" onClick={() => setIsEntityDropdownOpen(false)} />

                                            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-2 max-h-72 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-in fade-in zoom-in transition-all">
                                                {entityOptions.length === 0 && <p className="px-5 py-3 text-sm text-gray-500">No targets found.</p>}

                                                {/* Funds Group */}
                                                {entityOptions.filter(e => e.type === 'fund').length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="px-5 py-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Funds</div>
                                                        {entityOptions.filter(e => e.type === 'fund').map(e => (
                                                            <button
                                                                key={e.id}
                                                                onClick={() => { setActiveEntityId(e.id); setIsEntityDropdownOpen(false); }}
                                                                className={cn("w-full text-left px-5 py-3 text-sm font-semibold transition-colors hover:bg-emerald-500/10 flex items-center gap-3", activeEntityId === e.id ? "text-emerald-400 bg-emerald-500/5" : "text-white")}
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                                {e.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Divider */}
                                                {entityOptions.filter(e => e.type === 'card').length > 0 && entityOptions.filter(e => e.type === 'fund').length > 0 && (
                                                    <div className="h-px bg-white/10 mx-5 my-1" />
                                                )}

                                                {/* Cards Group */}
                                                {entityOptions.filter(e => e.type === 'card').length > 0 && (
                                                    <div className="mt-2">
                                                        <div className="px-5 py-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Credit Cards</div>
                                                        {entityOptions.filter(e => e.type === 'card').map(e => (
                                                            <button
                                                                key={e.id}
                                                                onClick={() => { setActiveEntityId(e.id); setIsEntityDropdownOpen(false); }}
                                                                className={cn("w-full text-left px-5 py-3 text-sm font-semibold transition-colors hover:bg-emerald-500/10 flex items-center gap-3", activeEntityId === e.id ? "text-emerald-400 bg-emerald-500/5" : "text-white")}
                                                            >
                                                                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                                                                {e.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body: metrics + scrollable list ── */}
            <div
                key={`${slideKey}-body`}
                className={cn(
                    "flex-1 flex flex-col min-h-0 w-full max-w-lg mx-auto px-4 pt-3 animate-in fade-in duration-300 fill-mode-both",
                    slideDirection === 'left' ? "slide-in-from-right-8" : "slide-in-from-left-8"
                )}
            >

                {/* Summary metrics — always visible */}
                <div className="shrink-0 grid grid-cols-3 gap-2 pb-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                        <p className="text-sm font-mono font-bold text-emerald-500">₹{metrics.paid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Pending</p>
                        <p className="text-sm font-mono font-bold text-blue-500">₹{metrics.pending.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Overdue</p>
                        <p className="text-sm font-mono font-bold text-red-500">₹{metrics.overdue.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* List — solely scrolls within this container */}
                <div
                    className="flex-1 overflow-y-auto min-h-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
                >                    {finalRows.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2">
                        <LayoutList className="w-8 h-8 text-gray-500 mb-3 opacity-50" />
                        <p className="text-sm font-medium text-gray-300">No records found</p>
                        <p className="text-xs text-gray-500 mt-1">Adjust filters to see history.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {finalRows.map(row => (
                            <div key={row.id}
                                onClick={() => navigate(`/${row.type === 'fund' ? 'funds' : 'cards'}/${row.entityId}`)}
                                className="bg-[#111] border border-white/5 rounded-xl p-3.5 flex items-center justify-between group transition-colors hover:bg-[#1a1a1a] cursor-pointer active:scale-[0.98]">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {row.isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                            row.dueDate < new Date() ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                                                <Clock className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white leading-tight">{row.name}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-1">
                                            {row.dateLabel ? row.dateLabel : format(row.dueDate, 'dd MMM yy')} • {row.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right text-white">
                                    {row.isPaid ? (
                                        <span className="text-sm font-mono font-bold text-white">
                                            ₹{Number(row.amount).toLocaleString('en-IN')}
                                        </span>
                                    ) : row.type === 'card' ? (
                                        <span className="text-sm font-mono font-semibold text-gray-500">
                                            TBA
                                        </span>
                                    ) : (
                                        <span className="text-sm font-mono font-bold text-white">
                                            ₹{Number(row.amount).toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1 text-right",
                                        row.isPaid ? "text-emerald-500" : row.dueDate < new Date() ? "text-red-500" : "text-blue-500"
                                    )}>
                                        {row.isPaid ? 'PAID' : row.dueDate < new Date() ? 'OVERDUE' : 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
            {/* Resolve the raw entity object for detailed cover pages if applicable */}
            {(() => {
                const typePrefix = activeEntityId.startsWith('fund') ? 'fund-' : 'card-';
                const rawId = activeEntityId.replace(typePrefix, '');
                const entityContext = viewMode === 'entity' 
                    ? (activeEntityId.startsWith('fund') ? funds.find(f => f.id === rawId) : cards.find(c => c.id === rawId))
                    : undefined;

                return (
                    <DynamicStatementDocument
                        rows={finalRows}
                        monthLabel={displayLabel}
                        filterType={viewMode === 'month' ? subType : (activeEntityId.startsWith('fund') ? 'fund' : 'card')}
                        metrics={metrics}
                        entityContext={entityContext}
                    />
                );
            })()}
        </div>
    );
}
