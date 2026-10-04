import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface DeleteSectionProps {
    onDelete: () => void;
    isPending?: boolean;
}

export function DeleteSection({ onDelete, isPending }: DeleteSectionProps) {
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive text-sm hover:bg-destructive/5 transition-colors"
            >
                <Trash2 className="w-4 h-4" /> Delete Card
            </button>

            <ConfirmDialog
                open={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={onDelete}
                isPending={isPending}
                title="Delete this card?"
                description="This permanently removes the card and all its payment history. This can't be undone."
                confirmLabel="Delete Card"
            />
        </>
    );
}
