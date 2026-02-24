import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthNavigationProps {
    viewMonth: Date;
    canGoPrev: boolean;
    canGoNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    isLoading?: boolean;
}

export function MonthNavigation({
    viewMonth,
    canGoPrev,
    canGoNext,
    onPrev,
    onNext,
    isLoading
}: MonthNavigationProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
                <div className="w-8 h-8 bg-secondary rounded-lg animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="w-8 h-8 bg-secondary rounded-lg animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
            <button
                onClick={onPrev}
                disabled={!canGoPrev}
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    canGoPrev
                        ? 'bg-secondary hover:bg-secondary/80'
                        : 'opacity-30 cursor-not-allowed'
                )}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{format(viewMonth, 'MMMM yyyy')}</span>
            <button
                onClick={onNext}
                disabled={!canGoNext}
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    canGoNext
                        ? 'bg-secondary hover:bg-secondary/80'
                        : 'opacity-30 cursor-not-allowed'
                )}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}