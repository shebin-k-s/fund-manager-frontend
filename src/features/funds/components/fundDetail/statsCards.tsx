import { cn } from '@/lib/utils';

interface StatsCardsProps {
    target: number | null;
    invested: number;
    payments: number;
    totalTerms: number | null;
    missed: number;
    isLoading?: boolean;
}

export function FundStatsCards({ target, invested, payments, totalTerms, missed, isLoading }: StatsCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="stat-card text-center py-3">
                        <div className="h-2 w-16 bg-muted rounded animate-pulse mx-auto mb-1.5" />
                        <div className="h-5 w-20 bg-muted rounded animate-pulse mx-auto" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2.5">
            <div className="stat-card flex flex-col justify-center items-center py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Target</p>
                <p className="text-sm font-bold text-white">
                    {target !== null ? `₹${target.toLocaleString('en-IN')}` : 'Ongoing'}
                </p>
            </div>
            <div className="stat-card flex flex-col justify-center items-center py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Invested</p>
                <p className="text-sm font-bold text-emerald-400">
                    ₹{invested.toLocaleString('en-IN')}
                </p>
            </div>
            <div className="stat-card flex flex-col justify-center items-center py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Payments</p>
                <p className="text-sm font-bold text-white">
                    {totalTerms ? `${payments} / ${totalTerms}` : payments}
                </p>
            </div>
            <div className="stat-card flex flex-col justify-center items-center py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Missed</p>
                <p className={cn(
                    'text-sm font-bold',
                    missed > 0 ? 'text-red-400' : 'text-emerald-400'
                )}>
                    {missed}
                </p>
            </div>
        </div>
    );
}