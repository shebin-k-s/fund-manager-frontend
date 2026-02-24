import { Link } from 'react-router-dom';
import { Plus, CalendarClock } from 'lucide-react';

export function DashboardEmptyState() {
    return (
        <div className="page-content">
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <CalendarClock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Get Started</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-[240px] mx-auto">
                    Add a fund or credit card to start tracking your payments
                </p>
                <div className="flex gap-3 justify-center">
                    <Link
                        to="/funds/new"
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Fund
                    </Link>
                    <Link
                        to="/cards/new"
                        className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Card
                    </Link>
                </div>
            </div>
        </div>
    );
}

interface EmptyStateProps {
    message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className="text-center py-6 bg-secondary/30 rounded-xl">
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}