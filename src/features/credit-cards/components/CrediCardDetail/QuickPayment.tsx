import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';

interface QuickPaymentProps {
    cycleId: string;
    onSubmit: (amount: number) => void;
    onCancel: () => void;
    isPending?: boolean;
}

export function QuickPayment({ cycleId, onSubmit, onCancel, isPending }: QuickPaymentProps) {
    const [amount, setAmount] = useState<string>('');

    const handleSubmit = () => {
        const numAmount = parseFloat(amount) || 0;
        onSubmit(numAmount);
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
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isPending) {
                            handleSubmit();
                        }
                    }}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                    Enter 0 if no payment was due
                </p>
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
