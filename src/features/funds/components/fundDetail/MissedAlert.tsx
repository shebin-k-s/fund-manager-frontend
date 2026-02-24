import { AlertTriangle } from 'lucide-react';

interface MissedAlertProps {
    missed: number;
    isLoading?: boolean;
}

export function MissedAlert({ missed, isLoading }: MissedAlertProps) {
    if (isLoading) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-destructive/20 rounded animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 w-32 bg-destructive/20 rounded animate-pulse mb-1" />
                        <div className="h-3 w-40 bg-destructive/20 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (missed === 0) return null;

    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
                <p className="text-sm font-semibold text-destructive">
                    {missed} Missed Payment{missed > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-destructive/70">
                    You have unpaid dates that are past due
                </p>
            </div>
        </div>
    );
}