import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackToClose } from '@/hooks/useBackToClose';

const TOP_GAP = 48; // px kept free above the sheet when it is raised for typing
const HIDE_DELAY = 350; // ms: Android blinks the keyboard when focus moves between fields; shorter than this is not "done typing"

// The part of the Visual Keyboard API this uses (Chrome / Edge on Android). Elsewhere it is simply absent.
interface VirtualKeyboardLike extends EventTarget {
  overlaysContent: boolean;
  boundingRect: DOMRect;
}

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && el.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable=true]');

// While a sheet is open the keyboard is told to overlay the page instead of resizing or panning it, so nothing in
// the layout moves when it appears, disappears or blinks. Only while a sheet is open: the rest of the app keeps its
// normal keyboard behaviour. `onGeometry` hears the keyboard's real height where the browser can report it.
function useKeyboardOverlays(onGeometry: (height: number) => void) {
  const latest = useRef(onGeometry);
  latest.current = onGeometry;
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const original = meta?.content;
    if (meta && original && !original.includes('interactive-widget')) meta.content = `${original}, interactive-widget=overlays-content`;

    const vk = (navigator as Navigator & { virtualKeyboard?: VirtualKeyboardLike }).virtualKeyboard;
    const wasOverlaying = vk?.overlaysContent ?? false;
    const onChange = () => vk && latest.current(vk.boundingRect.height);
    if (vk) {
      vk.overlaysContent = true;
      vk.addEventListener('geometrychange', onChange);
    }
    return () => {
      if (meta && original) meta.content = original;
      if (vk) {
        vk.removeEventListener('geometrychange', onChange);
        vk.overlaysContent = wasOverlaying;
      }
    };
  }, []);
}

interface BottomSheetProps {
  onClose: () => void;
  locked?: boolean; // true while something is saving: the sheet cannot be dismissed
  children: ReactNode; // should include a Dialog.Title
}

// A sheet that is exactly as tall as its content and rests on the bottom edge. Tapping a text field raises it once
// to a fixed place near the top (the keyboard covers the empty space below it) and it stays there while focus moves
// between fields, so it cannot flicker with the keyboard; it settles back when typing is over. Put what the user
// must always reach (Save, Cancel, Done) at the top of the content. Mount it to open it.
export function BottomSheet({ onClose, locked = false, children }: BottomSheetProps) {
  useBackToClose(true, onClose);
  const sheet = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();
  const [lift, setLift] = useState(0); // px the sheet is raised, 0 at rest

  const raise = () => {
    window.clearTimeout(timer.current);
    const height = sheet.current?.getBoundingClientRect().height ?? 0;
    setLift(Math.max(0, window.innerHeight - TOP_GAP - height));
  };
  const lower = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLift(0), HIDE_DELAY);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useKeyboardOverlays((keyboardHeight) => {
    // The keyboard was hidden (or brought back) without focus changing: follow it, but only on a settled value.
    if (keyboardHeight === 0) lower();
    else if (isTextField(document.activeElement)) raise();
  });

  return (
    <Dialog.Root open onOpenChange={(next) => !next && !locked && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          // Opening a sheet must not raise the keyboard: nothing is focused until a field is tapped.
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ transform: `translateY(${-lift}px)` }}
          className="fixed inset-x-0 bottom-0 z-[60] w-full max-w-md mx-auto focus:outline-none transition-transform duration-200 ease-out"
        >
          {/* No `transition` here: the browser default (all properties) would ease any size change over 0.2s. */}
          <div
            ref={sheet}
            onFocusCapture={(e) => isTextField(e.target) && raise()}
            onBlurCapture={(e) => isTextField(e.target) && lower()}
            className="bg-card border border-border shadow-2xl rounded-t-3xl p-6 space-y-5 max-h-[calc(100dvh-3rem)] overflow-y-auto transition-none animate-in slide-in-from-bottom duration-200"
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
