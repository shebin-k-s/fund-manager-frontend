import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AmountInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Rupee amount field: text input with a decimal keypad on mobile, so there
 * are no spinner arrows and the mouse wheel can't change the value. Only
 * digits and up to 2 decimal places are accepted.
 */
export function AmountInput({ value, onChange, className, ...props }: AmountInputProps) {
    return (
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₹</span>
            <input
                {...props}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={value}
                onChange={(e) => {
                    const next = e.target.value.replace(/,/g, '');
                    if (/^\d*\.?\d{0,2}$/.test(next)) onChange(next);
                }}
                className={cn(
                    'w-full bg-card border border-border rounded-xl pl-8 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    className
                )}
            />
        </div>
    );
}
