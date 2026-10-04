import * as Dialog from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { useBackToClose } from '@/hooks/useBackToClose';

interface ConfirmDialogProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
    description?: string | null;
    confirmLabel?: string;
    pendingLabel?: string;
    isPending?: boolean;
}

/**
 * Confirmation modal for destructive actions (same design as Spendly's
 * ConfirmModal). Stays open while `isPending` so the caller can close it once
 * the action finishes; the Back button closes it like Cancel.
 */
export function ConfirmDialog({
    open,
    onCancel,
    onConfirm,
    title,
    description,
    confirmLabel = 'Delete',
    pendingLabel = 'Deleting...',
    isPending = false,
}: ConfirmDialogProps) {
    useBackToClose(open, onCancel);

    return (
        <Dialog.Root open={open} onOpenChange={(next) => !next && !isPending && onCancel()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-sm translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none">
                    <div className="bg-card border border-border shadow-2xl rounded-3xl overflow-hidden p-5 animate-in fade-in zoom-in duration-200">
                        <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
                        {description && (
                            <Dialog.Description className="text-sm text-muted-foreground mt-2 mb-6">
                                {description}
                            </Dialog.Description>
                        )}

                        <div className="flex gap-3 w-full mt-6">
                            <button
                                type="button"
                                disabled={isPending}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                                onClick={onConfirm}
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isPending ? pendingLabel : confirmLabel}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
