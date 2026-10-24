import { useEffect, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackToClose } from '@/hooks/useBackToClose';

// By default Chrome on Android leaves the page alone when the keyboard opens and pans the screen over it, so a
// bottom sheet has to be repositioned from script, a frame behind the browser, and visibly jumps. Asking Chrome to
// resize the page instead keeps a plain `bottom: 0` sheet sitting on top of the keyboard with nothing to track.
// Only while a sheet is open: the rest of the app keeps its normal keyboard behaviour.
function useResizeWithKeyboard() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta || meta.content.includes('interactive-widget')) return;
    const original = meta.content;
    meta.content = `${original}, interactive-widget=resizes-content`;
    return () => {
      meta.content = original;
    };
  }, []);
}

interface BottomSheetProps {
  onClose: () => void;
  locked?: boolean; // true while something is saving: the sheet cannot be dismissed
  children: ReactNode; // should include a Dialog.Title
}

// A sheet from the bottom edge, as wide as the app column. Mount it to open it.
export function BottomSheet({ onClose, locked = false, children }: BottomSheetProps) {
  useBackToClose(true, onClose);
  useResizeWithKeyboard();

  return (
    <Dialog.Root open onOpenChange={(next) => !next && !locked && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          // Opening a sheet must not raise the keyboard: nothing is focused until a field is tapped.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-[60] w-full max-w-md mx-auto focus:outline-none"
        >
          {/* No `transition`: with the browser's default (all properties) the height would ease over 0.2s while the
              keyboard moves the sheet instantly, which reads as a wobble. */}
          <div className="bg-card border border-border shadow-2xl rounded-t-3xl p-6 space-y-5 max-h-[92dvh] overflow-y-auto transition-none animate-in slide-in-from-bottom duration-200">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
