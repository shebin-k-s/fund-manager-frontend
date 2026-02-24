import { useState } from 'react';

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
            <div className="flex flex-col gap-2">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount paid"
                    className="w-full px-3 py-3 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary text-sm"
                    autoFocus
                    min="0"
                    step="1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isPending) {
                            handleSubmit();
                        }
                    }}
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                        {isPending ? 'Saving...' : 'Save Payment'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Enter 0 if no payment was made
            </p>
        </div>
    );
}