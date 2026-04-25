import { Link } from 'react-router-dom';
import { format, isBefore } from 'date-fns';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Fund } from '@/types/finance';
import { EmptyState } from './EmptyState';

interface UpcomingFundsProps {
    funds: Array<{ fund: Fund; date: Date }>;
    today: Date;
    isLoading?: boolean;
}

export function UpcomingFunds({ funds, today, isLoading }: UpcomingFundsProps) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-blue-700/80 rounded-full" />
                    <h2 className="text-[15px] font-bold tracking-tight text-white/95">Fund Payments</h2>
                </div>
                {!isLoading && funds.length > 0 && (
                    <Link to="/funds" className="text-[10px] uppercase font-bold tracking-wider text-blue-300/60 hover:text-blue-300 transition-colors">
                        See All
                    </Link>
                )}
            </div>

            {isLoading ? (
                <UpcomingFundsSkeleton />
            ) : funds.length > 0 ? (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {funds.map(({ fund, date }) => (
                        <UpcomingFundItem key={fund.id} fund={fund} date={date} today={today} />
                    ))}
                </div>
            ) : (
                <EmptyState message="No upcoming fund payments" />
            )}
        </div>
    );
}

interface UpcomingFundItemProps {
    fund: Fund;
    date: Date;
    today: Date;
}

function UpcomingFundItem({ fund, date, today }: UpcomingFundItemProps) {
    const overdue = isBefore(date, today);

    return (
        <Link
            to={`/funds/${fund.id}`}
            className="touch-card p-3.5 flex items-center gap-3.5 group"
        >
            <div className="w-11 h-11 rounded-xl bg-blue-900/40 border border-blue-800/50 flex items-center justify-center text-blue-200/90 group-hover:scale-110 shadow-sm transition-transform duration-300">
                <Landmark className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] text-white/90 truncate transition-colors group-hover:text-white">{fund.name}</p>
                <p className="text-[12px] font-medium text-muted-foreground/80">
                    ₹{fund.amount.toLocaleString('en-IN')}
                </p>
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

function UpcomingFundsSkeleton() {
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