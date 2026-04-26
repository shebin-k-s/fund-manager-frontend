import { Wallet, CreditCard as CCIcon, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
    fundsStats: {
        totalInvested: number;
        count: number;
    };
    cardsStats: {
        totalPaid: number;
        count: number;
    };
    isLoading?: {
        funds: boolean;
        cards: boolean;
    };
}

export function StatsCards({ fundsStats, cardsStats, isLoading }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard
                title="Fund Payments"
                value={fundsStats.totalInvested}
                subtitle={`Total across ${fundsStats.count} fund${fundsStats.count !== 1 ? 's' : ''}`}
                icon={Landmark}
                color="navy"
                isLoading={isLoading?.funds}
            />
            <StatCard
                title="Card Bill Paid"
                value={cardsStats.totalPaid}
                subtitle={`Total across ${cardsStats.count} card${cardsStats.count !== 1 ? 's' : ''}`}
                icon={CCIcon}
                color="forest"
                isLoading={isLoading?.cards}
            />
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    color: 'navy' | 'forest';
    isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, isLoading }: StatCardProps) {
    const colorClasses = {
        navy: {
            bg: 'bg-blue-900/40 border-blue-800/50',
            text: 'text-blue-200/90',
        },
        forest: {
            bg: 'bg-emerald-900/40 border-emerald-800/50',
            text: 'text-emerald-200/90',
        }
    };

    const classes = colorClasses[color] || { bg: 'bg-white/5 border-white/10', text: 'text-white/80' };

    return (
        <div className="glass-card glass-card-hover p-4 group relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 flex flex-col gap-2">
                <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300 shadow-sm relative overflow-hidden", classes.bg)}>
                    <Icon className={cn("w-5 h-5 z-10", classes.text)} />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted-foreground/70">{title}</p>
                {isLoading ? (
                    <>
                        <div className="h-7 w-24 bg-white/5 rounded-lg animate-pulse mt-1" />
                        <div className="h-3 w-20 bg-white/5 rounded animate-pulse mt-2" />
                    </>
                ) : (
                    <>
                        <p className="text-[20px] font-extrabold text-white/95 mt-1 tracking-tight drop-shadow-sm">
                            ₹{value.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground/80 mt-0.5">{subtitle}</p>
                    </>
                )}
            </div>
        </div>
    );
}