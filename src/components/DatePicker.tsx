import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value?: Date;
    onChange: (date?: Date) => void;
    placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-left flex items-center gap-2",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    {value ? format(value, 'PPP') : placeholder || 'Pick a date'}
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false); 
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                />
            </PopoverContent>
        </Popover>
    );
}