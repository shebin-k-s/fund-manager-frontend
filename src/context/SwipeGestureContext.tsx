import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

interface SwipeGestureContextValue {
  /** Call at the start of a local horizontal touch to block global tab swipe */
  disableGlobalSwipe: () => void;
  /** Call at the end of a local horizontal touch to restore global tab swipe */
  enableGlobalSwipe: () => void;
  /** Read by the global handler – true means global swipe is active */
  isGlobalSwipeEnabled: () => boolean;
}

const SwipeGestureContext = createContext<SwipeGestureContextValue>({
  disableGlobalSwipe: () => {},
  enableGlobalSwipe: () => {},
  isGlobalSwipeEnabled: () => true,
});

export function SwipeGestureProvider({ children }: { children: ReactNode }) {
  // Use a ref so reads in touch handlers are always in sync (no stale closure)
  const enabledRef = useRef(true);

  const disableGlobalSwipe = useCallback(() => {
    enabledRef.current = false;
  }, []);

  const enableGlobalSwipe = useCallback(() => {
    enabledRef.current = true;
  }, []);

  const isGlobalSwipeEnabled = useCallback(() => enabledRef.current, []);

  return (
    <SwipeGestureContext.Provider value={{ disableGlobalSwipe, enableGlobalSwipe, isGlobalSwipeEnabled }}>
      {children}
    </SwipeGestureContext.Provider>
  );
}

export function useSwipeGesture() {
  return useContext(SwipeGestureContext);
}
