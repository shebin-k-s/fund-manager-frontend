import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';

interface FundHeaderProps {
    name: string;
    recurrenceLabel: string;
    amount: number;
    fundId: string;
    isLoading?: boolean;
}

export function FundHeader({ name, recurrenceLabel, amount, fundId, isLoading }: FundHeaderProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="page-header flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
                <div className="flex-1 min-w-0">
                    <div className="h-6 w-40 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
            </div>
        );
    }

    return (
        <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
            <button
                onClick={() => navigate('/funds')}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
            </button>
            <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{name}</h1>
                <p className="text-xs text-muted-foreground">
                    {recurrenceLabel} · ₹{amount.toLocaleString('en-IN')}
                </p>
            </div>
            <Link
                to={`/funds/${fundId}/edit`}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
                <Pencil className="w-4 h-4 text-secondary-foreground" />
            </Link>
        </div>
    );
}