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
        <div className="stat-card">
            <div className={`w-8 h-8 rounded-lg ${classes.bg} flex items-center justify-center mb-2.5`}>
                <Icon className={`w-4 h-4 ${classes.text}`} />
            </div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {isLoading ? (
                <>
                    <div className={`h-7 w-24 ${classes.pulse} rounded animate-pulse mt-0.5`} />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
                </>
            ) : (
                <>
                    <p className={`text-xl font-bold ${classes.text} mt-0.5`}>
                        ₹{value.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </>
            )}
        </div>
    );
}