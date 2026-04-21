import { Wallet, CreditCard as CCIcon } from 'lucide-react';

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
                title="Fund Invested"
                value={fundsStats.totalInvested}
                subtitle={`${fundsStats.count} active fund${fundsStats.count !== 1 ? 's' : ''}`}
                icon={Wallet}
                color="primary"
                isLoading={isLoading?.funds}
            />
            <StatCard
                title="Cards Paid"
                value={cardsStats.totalPaid}
                subtitle={`${cardsStats.count} card${cardsStats.count !== 1 ? 's' : ''}`}
                icon={CCIcon}
                color="warning"
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
    color: 'primary' | 'warning';
    isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, isLoading }: StatCardProps) {
    const colorClasses = {
        primary: {
            bg: 'bg-primary/15',
            text: 'text-primary',
            pulse: 'bg-primary/10'
        },
        warning: {
            bg: 'bg-warning/15',
            text: 'text-warning',
            pulse: 'bg-warning/10'
        }
    };

    const classes = colorClasses[color];

    return (
        <div className="glass-card p-4 transition-all duration-300 hover:bg-white/10 group">
            <div className={`w-10 h-10 rounded-xl ${classes.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${classes.text}`} />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">{title}</p>
            {isLoading ? (
                <>
                    <div className={`h-8 w-24 ${classes.pulse} rounded-lg animate-pulse mt-1`} />
                    <div className="h-3 w-20 bg-muted/50 rounded animate-pulse mt-2" />
                </>
            ) : (
                <>
                    <p className={`text-xl font-bold ${classes.text} mt-1 tracking-tight`}>
                        ₹{value.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1.5">{subtitle}</p>
                </>
            )}
        </div>
    );
}