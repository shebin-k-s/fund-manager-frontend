import { useEffect, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackToClose } from '@/hooks/useBackToClose';

// Android Chrome briefly hides and re-shows the keyboard when focus moves between fields. A sheet that sits on top of
// the keyboard follows every one of those flickers, and one that is repositioned from script lags the browser's own
// screen pan. So the sheet does neither: while it is open the keyboard is told to overlay the page (nothing is resized
// or panned), and the sheet has a fixed place, so it cannot move. Only while a sheet is open: the rest of the app keeps
// its normal keyboard behaviour.
function useKeyboardOverlays() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta || meta.content.includes('interactive-widget')) return;
    const original = meta.content;
    meta.content = `${original}, interactive-widget=overlays-content`;
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

// A sheet rising from the bottom edge up to just under the top, as wide as the app column. Put what the user must
// always reach (Save, Cancel, Done) at its top: the keyboard covers its lower part while typing. Mount it to open it.
export function BottomSheet({ onClose, locked = false, children }: BottomSheetProps) {
  useBackToClose(true, onClose);
  useKeyboardOverlays();

  return (
    <Dialog.Root open onOpenChange={(next) => !next && !locked && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          // Opening a sheet must not raise the keyboard: nothing is focused until a field is tapped.
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 top-12 bottom-0 z-[60] w-full max-w-md mx-auto focus:outline-none"
        >
          {/* No `transition`: the browser default (all properties) would ease any size change over 0.2s. */}
          <div className="h-full bg-card border border-border shadow-2xl rounded-t-3xl p-6 space-y-5 overflow-y-auto transition-none animate-in slide-in-from-bottom duration-200">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
