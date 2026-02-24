import { Link } from 'react-router-dom';
import { format, isBefore } from 'date-fns';
import { ArrowRight } from 'lucide-react';
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
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Upcoming Fund Payments</h2>
                {!isLoading && funds.length > 0 && (
                    <Link to="/funds" className="text-xs text-primary flex items-center gap-1 hover:underline">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>

            {isLoading ? (
                <UpcomingFundsSkeleton />
            ) : funds.length > 0 ? (
                <div className="space-y-2.5">
                    {funds.slice(0, 3).map(({ fund, date }) => (
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
            className="touch-card p-3.5 flex items-center gap-3 hover:bg-accent/50 transition-colors"
        >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-base">
                💰
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fund.name}</p>
                <p className="text-xs text-muted-foreground">
                    ₹{fund.amount.toLocaleString('en-IN')}
                </p>
            </div>
            <div className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-lg',
                overdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
            )}>
                {overdue ? 'Overdue' : format(date, 'MMM d')}
            </div>
        </Link>
    );
}

function UpcomingFundsSkeleton() {
    return (
        <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
                <div key={i} className="touch-card p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 animate-pulse" />
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