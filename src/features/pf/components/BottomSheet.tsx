import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackToClose } from '@/hooks/useBackToClose';

// The part of the screen the on-screen keyboard has not covered. A sheet pinned to the bottom of the page sits
// under the keyboard; pinned to this area it rides on top of it.
function useVisibleViewport() {
  const read = () => {
    const vv = window.visualViewport;
    return vv ? { height: vv.height, inset: Math.max(0, window.innerHeight - vv.height - vv.offsetTop) } : { height: window.innerHeight, inset: 0 };
  };
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport(read());
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return viewport;
}

interface BottomSheetProps {
  onClose: () => void;
  locked?: boolean; // true while something is saving: the sheet cannot be dismissed
  children: ReactNode; // should include a Dialog.Title
}

// A sheet from the bottom edge, as wide as the app column. Mount it to open it.
export function BottomSheet({ onClose, locked = false, children }: BottomSheetProps) {
  useBackToClose(true, onClose);
  const { height, inset } = useVisibleViewport();

  return (
    <Dialog.Root open onOpenChange={(next) => !next && !locked && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          // Opening a sheet must not raise the keyboard: nothing is focused until a field is tapped.
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ bottom: inset }}
          className="fixed inset-x-0 z-[60] w-full max-w-md mx-auto focus:outline-none"
        >
          <div
            style={{ maxHeight: height * 0.92 }}
            // Once the keyboard is up, bring the tapped field into the middle of what is still visible.
            onFocusCapture={(e) => {
              const field = e.target as HTMLElement;
              window.setTimeout(() => field.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
            }}
            className="bg-card border border-border shadow-2xl rounded-t-3xl p-6 space-y-5 overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
