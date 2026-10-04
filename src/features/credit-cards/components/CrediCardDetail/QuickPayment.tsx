import { useState } from 'react';
import { isToday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';
import { DatePicker } from '@/components/DatePicker';

interface QuickPaymentProps {
    cycleId: string;
    onSubmit: (amount: number, paidAt?: string) => void;
    onCancel: () => void;
    isPending?: boolean;
}

export function QuickPayment({ cycleId, onSubmit, onCancel, isPending }: QuickPaymentProps) {
    const [amount, setAmount] = useState<string>('');
    const [paidOn, setPaidOn] = useState<Date | undefined>(new Date());

    const handleSubmit = () => {
        const numAmount = parseFloat(amount) || 0;
        // Today → let the server stamp the time; a past day → midday, so the
        // timezone can't shift it to another date
        const day = paidOn ?? new Date();
        const paidAt = isToday(day)
            ? undefined
            : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString();
        onSubmit(numAmount, paidAt);
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Amount paid</label>
                <AmountInput
                    value={amount}
                    onChange={setAmount}
                    placeholder="0"
                    autoFocus
                    className="text-base font-semibold"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                    Enter 0 if no payment was due
                </p>
            </div>

            <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Paid on</label>
                <DatePicker value={paidOn} onChange={setPaidOn} maxDate={new Date()} />
            </div>

            <div className="flex gap-2.5">
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                    {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Payment'}
                </button>
            </div>
        </div>
    );
}
