import { X } from 'lucide-react';

interface PaymentActionProps {
    date: string;
    paid: boolean;
    amount: number;
    onPay: () => void;
    onRemove: () => void;
    isPending?: boolean;
}

export function PaymentAction({
    date,
    paid,
    amount,
    onPay,
    onRemove,
    isPending
}: PaymentActionProps) {
    return (
        <div className="px-3.5 pb-3.5 border-t border-border pt-3">
            {paid ? (
                <button
                    onClick={onRemove}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                    {isPending ? (
                        <>Removing...</>
                    ) : (
                        <><X className="w-4 h-4" /> Remove Payment</>
                    )}
                </button>
            ) : (
                <button
                    onClick={onPay}
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isPending ? (
                        'Processing...'
                    ) : (
                        `Mark as Paid · ₹${amount.toLocaleString('en-IN')}`
                    )}
                </button>
            )}
        </div>
    );
}