import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardHeaderProps {
    cardName: string;
    cardId: string;
    isPending?: boolean;
    isLoading?: boolean;
}

export function CardHeader({ cardName, cardId, isPending, isLoading }: CardHeaderProps) {
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
            onClick={() => navigate('/cards')}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            disabled={isPending}
        >
            <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>

            <h1 className="text-xl font-bold truncate flex-1">{cardName}</h1>

            <Link
                to={`/cards/${cardId}/edit`}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
                <Pencil className="w-4 h-4 text-secondary-foreground" />
            </Link>
        </div>
    );
}