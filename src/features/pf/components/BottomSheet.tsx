import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useBackToClose } from '@/hooks/useBackToClose';

const TOP_GAP = 48; // px kept free above the sheet when it is raised for typing
const HIDE_DELAY = 350; // ms: Android blinks the keyboard when focus moves between fields; shorter than this is not "done typing"
const MIN_KEYBOARD = 120; // px: after the keyboard is dismissed Chrome still reports a ~47px strip; anything this small means "gone"
const SETTLE = 120; // ms a reported keyboard height must hold before the sheet follows it (a stale value shows for ~30ms on a type change)

// Keyboard heights in px by kind (number pad / text keyboard), so the sheet can rise at once when a field is tapped
// instead of waiting ~0.3s for the browser to report the real height. The defaults are one phone's; every report
// replaces them for the rest of the session.
const keyboardHeight: Record<'number' | 'text', number> = { number: 286, text: 315 };
const kindOf = (el: Element | null): 'number' | 'text' => (el instanceof HTMLElement && (el.inputMode === 'decimal' || el.inputMode === 'numeric') ? 'number' : 'text');

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

// A sheet that is exactly as tall as its content and rests on the bottom edge. Tapping a text field raises it so its
// bottom edge meets the top of the keyboard; it moves again only when the keyboard really changes (number pad <-> text
// keyboard), never with the keyboard's momentary blinks between fields, and settles back when typing is over. Put what the user
// must always reach (Save, Cancel, Done) at the top of the content. Mount it to open it.
export function BottomSheet({ onClose, locked = false, children }: BottomSheetProps) {
  useBackToClose(true, onClose);
  const sheet = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>();
  const settleTimer = useRef<number>();
  const [lift, setLift] = useState(0); // px the sheet is raised, 0 at rest
  const hasKeyboardApi = typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator;

  // Where a focused text field should put the sheet: flush on top of the keyboard when its height is known (the
  // sheet then has no gap above it and none hiding below it), otherwise a fixed spot near the top.
  const raise = (field: Element | null) => {
    window.clearTimeout(hideTimer.current);
    if (hasKeyboardApi) {
      setLift(keyboardHeight[kindOf(field)]);
      return;
    }
    const height = sheet.current?.getBoundingClientRect().height ?? 0;
    setLift(Math.max(0, window.innerHeight - TOP_GAP - height));
  };
  const lower = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setLift(0), HIDE_DELAY);
  };
  useEffect(
    () => () => {
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(settleTimer.current);
    },
    [],
  );

  useKeyboardOverlays((height) => {
    // The browser reports the keyboard's real height; follow it once it has held still for a moment.
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (height < MIN_KEYBOARD) return lower(); // hidden without focus changing (e.g. the Back key)
      const field = document.activeElement;
      keyboardHeight[kindOf(field)] = height;
      if (isTextField(field)) {
        window.clearTimeout(hideTimer.current);
        setLift(height);
      }
    }, SETTLE);
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
          {/* Only max-height eases, with the same 0.2s as the sheet's slide, so when a taller keyboard shrinks the sheet its
              top edge stays put. (The browser default, all properties, eased everything and made it wobble.) */}
          <div
            ref={sheet}
            style={{ maxHeight: Math.max(240, window.innerHeight - TOP_GAP - lift) }}
            onFocusCapture={(e) => isTextField(e.target) && raise(e.target as Element)}
            onBlurCapture={(e) => isTextField(e.target) && lower()}
            className="bg-card border border-border shadow-2xl rounded-t-3xl p-6 space-y-5 overflow-y-auto transition-[max-height] ease-out animate-in slide-in-from-bottom duration-200"
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
