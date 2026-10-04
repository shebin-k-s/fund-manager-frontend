import { useState } from 'react';
import { format } from 'date-fns';
import { HandCoins, Loader2, Pencil, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { DatePicker } from '@/components/DatePicker';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useSetFundPayout, useClearFundPayout } from '../../hooks/useFunds';
import type { Fund } from '../../types';
import { AmountInput } from '@/components/AmountInput';

interface PayoutSectionProps {
    fund: Fund;
    totalPaid: number;
}

/**
 * Records how much was received back when the fund paid out, and compares
 * it to what was paid in.
 */
export function PayoutSection({ fund, totalPaid }: PayoutSectionProps) {
    const setPayout = useSetFundPayout();
    const clearPayout = useClearFundPayout();

    const payoutAmount = fund.payoutAmount != null
        ? parseFloat(String(fund.payoutAmount).replace(/,/g, '')) || 0
        : null;

    const [isEditing, setIsEditing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | undefined>();

    const isPending = setPayout.isPending || clearPayout.isPending;

    const startEditing = () => {
        setAmount(payoutAmount != null ? String(payoutAmount) : '');
        setDate(fund.payoutDate ? new Date(fund.payoutDate) : new Date());
        setIsEditing(true);
    };

    const handleSave = () => {
        const value = parseFloat(amount);
        if (!value || value <= 0) {
            toast.error('Enter the amount you received');
            return;
        }
        if (!date) {
            toast.error('Pick the date you received it');
            return;
        }
        setPayout.mutate(
            { fundId: fund.id, amount: value, date: format(date, 'yyyy-MM-dd') },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    toast.success('Payout saved');
                },
                onError: (error) => toast.error(getErrorMessage(error) || 'Failed to save payout'),
            }
        );
    };

    const handleClear = () => {
        clearPayout.mutate(fund.id, {
            onSuccess: () => {
                setConfirmClear(false);
                toast.success('Payout removed');
            },
            onError: (error) => toast.error(getErrorMessage(error) || 'Failed to remove payout'),
        });
    };

    if (isEditing) {
        return (
            <div className="stat-card p-4 space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <HandCoins className="w-3.5 h-3.5 text-emerald-400" />
                    Record Payout
                </p>

                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Amount Received</label>
                    <AmountInput
                        value={amount}
                        onChange={setAmount}
                        placeholder={totalPaid > 0 ? totalPaid.toLocaleString('en-IN', { useGrouping: false }) : 'e.g. 50000'}
                        autoFocus
                    />
                    {totalPaid > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                            You've paid in ₹{totalPaid.toLocaleString('en-IN')} so far
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Date Received</label>
                    <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {setPayout.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
                    </button>
                </div>
            </div>
        );
    }

    if (payoutAmount == null) {
        return (
            <div className="stat-card p-5 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Payout
                    </p>
                    <p className="text-sm text-muted-foreground mt-1.5">Not received yet</p>
                </div>
                <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> Record
                </button>
            </div>
        );
    }

    const gain = Math.round((payoutAmount - totalPaid) * 100) / 100;
    const gainPct = totalPaid > 0 ? (gain / totalPaid) * 100 : null;
    const isGain = gain >= 0;

    return (
        <div className="stat-card p-5">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Payout Received
                </p>
                {fund.payoutDate && (
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(fund.payoutDate), 'd MMM yyyy')}
                    </p>
                )}
            </div>

            <p className="text-3xl font-bold text-white mt-2">
                ₹{payoutAmount.toLocaleString('en-IN')}
            </p>

            <div className="flex items-center gap-2 mt-3">
                <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                    isGain ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                )}>
                    {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isGain ? '+' : '−'}₹{Math.abs(gain).toLocaleString('en-IN')}
                    {gainPct !== null && ` (${Math.abs(gainPct).toFixed(1)}%)`}
                </span>
                <span className="text-xs text-muted-foreground">
                    on ₹{totalPaid.toLocaleString('en-IN')} paid in
                </span>
            </div>

            <div className="flex gap-5 mt-5 pt-4 border-t border-white/5">
                <button
                    onClick={startEditing}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
                >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                    onClick={() => setConfirmClear(true)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
            </div>

            <ConfirmDialog
                open={confirmClear}
                onCancel={() => setConfirmClear(false)}
                onConfirm={handleClear}
                isPending={clearPayout.isPending}
                title="Remove recorded payout?"
                description={`The payout of ₹${payoutAmount.toLocaleString('en-IN')} will be cleared from this fund.`}
                confirmLabel="Remove"
                pendingLabel="Removing..."
            />
        </div>
    );
}
