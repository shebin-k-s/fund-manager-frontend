import { useFundsQuery } from '@/features/funds/hooks/useFunds';
import { useCardsQuery } from '@/features/credit-cards/hooks/useCreditCards';
import { getFundPaymentDates, dateKey, isDatePaid } from '@/features/funds/utils/fundDateUtils';
import { getBillingCycles } from '@/features/credit-cards/utils/cardDateUtils';
import { Calendar } from '@/components/ui/calendar';
import { useState, useMemo } from 'react';
import { addMonths, startOfDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    
    const { data: funds = [] } = useFundsQuery();
    const { data: cards = [] } = useCardsQuery();

    // Map all payments 6 months into the future
    const dueMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        const rangeEnd = addMonths(startOfDay(new Date()), 6);

        // Map Funds
        funds.forEach(fund => {
            const dates = getFundPaymentDates(fund, rangeEnd);
            dates.forEach(d => {
                const k = dateKey(d);
                if (!map[k]) map[k] = [];
                map[k].push({
                    type: 'fund',
                    id: fund.id,
                    name: fund.name,
                    amount: fund.amount,
                    isPaid: isDatePaid(fund, d)
                });
            });
        });

        // Map Cards
        cards.forEach(card => {
            const cycles = getBillingCycles(card, rangeEnd);
            cycles.forEach(c => {
                const k = dateKey(c.dueDate);
                if (!map[k]) map[k] = [];
                map[k].push({
                    type: 'card',
                    id: card.id,
                    name: card.name,
                    amount: c.paidAmount || 0, // Fixed: use paidAmount
                    isPaid: c.isPaid
                });
            });
        });

        return map;
    }, [funds, cards]);

    const CustomDay = (props: any) => {
        const k = props.date ? dateKey(props.date) : '';
        const markers = dueMap[k];
        
        if (!markers || markers.length === 0) {
            return (
                <div className="flex items-center justify-center w-full h-full text-white/80">
                    {props.date.getDate()}
                </div>
            );
        }

        const allPaid = markers.every(m => m.isPaid);
        const hasPendingFund = markers.some(m => !m.isPaid && m.type === 'fund');
        const hasPendingCard = markers.some(m => !m.isPaid && m.type === 'card');

        return (
            <div className="flex flex-col items-center justify-center w-full h-full relative group">
                <span className={cn("font-bold z-10", allPaid ? "text-emerald-400" : "text-white")}>
                    {props.date.getDate()}
                </span>
                
                {/* Visual Backdrop for entirely Paid days */}
                {allPaid && (
                    <div className="absolute inset-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 pointer-events-none" />
                )}

                {/* Glowing Dot markings purely for Pending items */}
                {!allPaid && (
                    <div className="flex gap-1 absolute bottom-1 z-10">
                        {hasPendingFund && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" title="Pending Fund" />}
                        {hasPendingCard && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" title="Pending Card" />}
                    </div>
                )}
            </div>
        );
    };

    const selectedKey = selectedDate ? dateKey(selectedDate) : '';
    const dayData = dueMap[selectedKey] || [];

    return (
        <div className="animate-fade-in bg-background min-h-full">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-2xl border-b border-white/10 shadow-sm">
                <div className="px-5 pt-5 pb-4 flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-white">Calendar</h1>
                        <p className="text-xs text-muted-foreground mt-0.5 tracking-wider uppercase font-semibold">
                            Upcoming Schedules
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-6">
                <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-4 shadow-2xl w-full">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="w-full flex justify-center text-white"
                        components={{
                            DayContent: CustomDay
                        }}
                    />
                </div>
                
                {/* Details area for the selected date */}
                <div className="w-full">
                    <h3 className="text-sm font-semibold text-white mb-3 px-1">
                        {selectedDate ? format(selectedDate, 'EEEE, MMMM do yyyy') : 'Select a date'}
                    </h3>
                    
                    {dayData.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-6 flex flex-col items-center text-center">
                            <p className="text-sm text-gray-500">No payments scheduled on this date.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {dayData.map((data, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03] shadow-md">
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "w-3 h-3 rounded-full shrink-0 flex items-center justify-center",
                                            data.isPaid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                            data.type === 'fund' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                                        )} />
                                        <div>
                                            <p className="text-sm font-semibold text-white tracking-wide">{data.name}</p>
                                            <p className={cn("text-[10px] uppercase tracking-widest font-bold mt-1", data.isPaid ? "text-emerald-400" : "text-gray-500")}>
                                                {data.type} • {data.isPaid ? 'PAID' : 'PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right flex flex-col items-end">
                                        {data.isPaid ? (
                                            <>
                                                <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest mb-0.5">Paid Details</span>
                                                <span className="text-sm font-mono font-bold text-emerald-400">
                                                    ₹{data.amount?.toLocaleString('en-IN') || 0}
                                                </span>
                                            </>
                                        ) : data.type === 'fund' ? (
                                            <span className="text-sm font-mono font-semibold text-gray-300">
                                                ₹{data.amount?.toLocaleString('en-IN') || 0}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
