// features/dashboard/components/ErrorState.tsx
import { AlertCircle } from 'lucide-react';

interface DashboardErrorStateProps {
    error?: Error | null;
    onRetry?: () => void;
}

export function DashboardErrorState({ error, onRetry }: DashboardErrorStateProps) {
    return (
        <div className="pt-8">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {error?.message || 'An error occurred while loading your dashboard data. Please try again.'}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}