import { useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { CreditCard as CCIcon, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreditCard } from '../../types';
import { getNextUnpaidCycle, getMissedCardCount } from '../../utils/cardDateUtils';

const gradients = [
    'cc-gradient-1',
    'cc-gradient-2',
    'cc-gradient-3',
    'cc-gradient-4',
];

// Helper function to format payment amount smartly
function formatPaymentAmount(amount: number): string {
    if (amount === 0) return '₹0';

    if (amount < 1000) {
        return `₹${amount}`;
    } else if (amount < 100000) {
        // Convert to thousands (K)
        const thousands = amount / 1000;
        return `₹${thousands.toFixed(1)}K`;
    } else {
        // Convert to lakhs (L)
        const lakhs = amount / 100000;
        return `₹${lakhs.toFixed(1)}L`;
    }
}

interface CardVisualProps {
    card: CreditCard;
    index: number;
}

export function CardVisual({ card, index }: CardVisualProps) {
    const navigate = useNavigate();

    const today = startOfDay(new Date());
    const nextCycle = getNextUnpaidCycle(card);
    const missedCount = getMissedCardCount(card);
    const isOverdue = nextCycle ? isBefore(nextCycle.dueDate, today) : false;

    // Calculate total paid
    const totalPaid = card.payments?.reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
        return sum + amount;
    }, 0) || 0;

    const paymentCount = card.payments?.length || 0;

    // Get formatted amount
    const formattedAmount = formatPaymentAmount(totalPaid);

    return (
        <div
            className={cn(
                'rounded-2xl p-5 aspect-[1.7/1] flex flex-col justify-between relative overflow-hidden group cursor-pointer',
                gradients[index % gradients.length],
                'hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]'
            )}
            onClick={() => navigate(`/cards/${card.id}`)}
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header with status badge */}
            <div className="relative z-10 flex items-start justify-between">
                <CCIcon className="w-8 h-8 opacity-80 text-white" strokeWidth={1.5} />

                {missedCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/30 backdrop-blur-sm border border-white/20">
                        <AlertCircle className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-medium text-white">
                            {missedCount} overdue
                        </span>
                    </div>
                )}

                {nextCycle && !isOverdue && missedCount === 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                        <Calendar className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-medium text-white">
                            Due {format(nextCycle.dueDate, 'MMM d')}
                        </span>
                    </div>
                )}
            </div>

            {/* Card details */}
            <div className="relative z-10 space-y-2">
                {/* Card number */}
                <p className="text-xs tracking-[0.2em] opacity-60 text-white font-mono">
                    •••• •••• •••• {card.lastFour || '••••'}
                </p>

                {/* Card name and stats */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="font-semibold text-white">{card.name}</p>
                        <p className="text-[10px] mt-0.5 opacity-70 text-white">
                            Bill: {card.billDate}th · Due: {card.dueDate}th
                        </p>
                    </div>

                    {paymentCount > 0 && (
                        <div className="text-right">
                            <p className="text-xs font-medium text-white">
                                {formattedAmount}
                            </p>
                            <p className="text-[10px] opacity-70 text-white">
                                {paymentCount} {paymentCount === 1 ? 'payment' : 'payments'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chip decoration - only show when no status badges */}
            {!missedCount && !nextCycle && (
                <div className="absolute top-5 right-5 w-10 h-7 rounded bg-gradient-to-br from-yellow-300/30 to-yellow-500/30 backdrop-blur-[2px] border border-white/20" />
            )}

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                }} />
            </div>
        </div>
    );
}