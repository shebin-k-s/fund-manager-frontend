import { cn } from '@/lib/utils';

interface StatsCardsProps {
    invested: number;
    payments: number;
    missed: number;
    isLoading?: boolean;
}

export function FundStatsCards({ invested, payments, missed, isLoading }: StatsCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="stat-card text-center">
                        <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto mb-2" />
                        <div className="h-6 w-20 bg-muted rounded animate-pulse mx-auto" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-2.5">
            <div className="stat-card text-center">
                <p className="text-xs text-muted-foreground">Invested</p>
                <p className="text-base font-bold text-primary mt-1">
                    ₹{invested.toLocaleString('en-IN')}
                </p>
            </div>
            <div className="stat-card text-center">
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-base font-bold mt-1">{payments}</p>
            </div>
            <div className="stat-card text-center">
                <p className="text-xs text-muted-foreground">Missed</p>
                <p className={cn(
                    'text-base font-bold mt-1',
                    missed > 0 ? 'text-destructive' : 'text-primary'
                )}>
                    {missed}
                </p>
            </div>
        </div>
    );
}