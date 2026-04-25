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
        
        return (
            <div className="flex flex-col items-center justify-center w-full h-full relative">
                <span>{props.date.getDate()}</span>
                {markers && markers.length > 0 && (
                    <div className="flex gap-[3px] absolute bottom-1">
                        {markers.map((m, i) => (
                            <span 
                                key={`${m.id}-${i}`} 
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full border border-[rgba(0,0,0,0.2)]",
                                    m.type === 'fund' 
                                        ? (m.isPaid ? 'bg-blue-900/50' : 'bg-blue-400')
                                        : (m.isPaid ? 'bg-purple-900/50' : 'bg-purple-400')
                                )} 
                            />
                        ))}
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
                        <div className="flex flex-col gap-2">
                            {dayData.map((data, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2.5 h-2.5 rounded-full shrink-0",
                                            data.type === 'fund' 
                                                ? (data.isPaid ? 'bg-blue-900' : 'bg-blue-400')
                                                : (data.isPaid ? 'bg-purple-900' : 'bg-purple-400')
                                        )} />
                                        <div>
                                            <p className="text-sm font-medium text-white">{data.name}</p>
                                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                                                {data.type} • {data.isPaid ? 'PAID' : 'PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                    {data.type === 'fund' && (
                                        <span className="text-sm font-mono text-gray-400">
                                            ₹{data.amount?.toLocaleString('en-IN') || 0}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
