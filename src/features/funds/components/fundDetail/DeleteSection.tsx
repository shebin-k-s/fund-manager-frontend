import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteSectionProps {
    onDelete: () => void;
    isPending?: boolean;
}

export function DeleteSection({ onDelete, isPending }: DeleteSectionProps) {
    const [showConfirm, setShowConfirm] = useState(false);

    if (showConfirm) {
        return (
            <div className="bg-destructive/10 rounded-xl p-4 text-center">
                <p className="text-sm text-destructive mb-3">
                    Delete this fund permanently?
                </p>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
                        disabled={isPending}
                    >
                        {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive text-sm hover:bg-destructive/5 transition-colors"
        >
            <Trash2 className="w-4 h-4" /> Delete Fund
        </button>
    );
}