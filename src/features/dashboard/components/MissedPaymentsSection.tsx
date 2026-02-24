import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Fund } from '@/features/funds/types';
import { CreditCard } from '@/features/credit-cards/types';

interface MissedPaymentsSectionProps {
    missedFunds: Array<{ fund: Fund; missed: number }>;
    missedCards: Array<{ card: CreditCard; missed: number }>;
    totalMissed: number;
    isLoading?: boolean;
}

export function MissedPaymentsSection({
    missedFunds,
    missedCards,
    totalMissed,
    isLoading
}: MissedPaymentsSectionProps) {
    if (isLoading) {
        return <MissedPaymentsSkeleton />;
    }

    if (totalMissed === 0) return null;

    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="text-sm font-bold text-destructive">
                    {totalMissed} Missed Payment{totalMissed > 1 ? 's' : ''}
                </h2>
            </div>
            <div className="space-y-2">
                {missedFunds.map(m => (
                    <MissedItem
                        key={m.fund.id}
                        id={m.fund.id}
                        icon="💰"
                        name={m.fund.name}
                        count={m.missed}
                        type="missed"
                    />
                ))}
                {missedCards.map(m => (
                    <MissedItem
                        key={m.card.id}
                        id={m.card.id}
                        icon="💳"
                        name={m.card.name}
                        count={m.missed}
                        type="overdue"
                    />
                ))}
            </div>
        </div>
    );
}

interface MissedItemProps {
    id: string;
    icon: string;
    name: string;
    count: number;
    type: 'missed' | 'overdue';
}

function MissedItem({ id, icon, name, count, type }: MissedItemProps) {
    return (
        <Link
            to={`/${type === 'missed' ? 'funds' : 'cards'}/${id}`}
            className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5 hover:bg-destructive/10 transition-colors"
        >
            <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium">{name}</span>
            </div>
            <span className="text-xs font-bold text-destructive bg-destructive/15 px-2 py-1 rounded-md">
                {count} {type}
            </span>
        </Link>
    );
}

function MissedPaymentsSkeleton() {
    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-destructive/20 rounded animate-pulse" />
                <div className="h-4 w-32 bg-destructive/20 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
                {[1, 2].map(i => (
                    <div key={i} className="flex items-center justify-between bg-destructive/5 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-destructive/20 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-destructive/20 rounded animate-pulse" />
                        </div>
                        <div className="h-5 w-16 bg-destructive/20 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}