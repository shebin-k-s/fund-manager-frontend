import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText } from 'lucide-react';
import { exportStatementToPdf } from '@/features/statements/utils/exportToPdf';
import { DataFreshnessIndicator } from '@/components/DataFreshnessIndicator';
import type { FreshnessStatus } from '@/hooks/useQueryFreshness';

interface CardHeaderProps {
    cardName: string;
    cardId: string;
    isPending?: boolean;
    isLoading?: boolean;
    freshness?: { status: FreshnessStatus; isFetching: boolean };
}

export function CardHeader({ cardName, cardId, isPending, isLoading, freshness }: CardHeaderProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="page-header flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
                <div className="h-7 w-40 bg-muted rounded animate-pulse flex-1" />
                <div className="w-9 h-9 rounded-xl bg-secondary animate-pulse" />
            </div>
        );
    }

    return (
        <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">            <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            disabled={isPending}
        >
            <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>

            <h1 className="text-xl font-bold flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">{cardName}</span>
                {freshness && <DataFreshnessIndicator status={freshness.status} isFetching={freshness.isFetching} />}
            </h1>

            <button
                onClick={() => exportStatementToPdf('card-statement-container', `${cardName}_Statement`)}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                title="Download Statement"
            >
                <FileText className="w-4 h-4 text-emerald-400" />
            </button>

            <Link
                to={`/cards/${cardId}/edit`}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
                <Pencil className="w-4 h-4 text-secondary-foreground" />
            </Link>
        </div>
    );
}