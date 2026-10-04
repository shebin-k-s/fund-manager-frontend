import { useCallback, useRef, useState, useLayoutEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, CalendarDays, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeGestureProvider, useSwipeGesture } from '@/context/SwipeGestureContext';

const PULL_THRESHOLD = 160; // px of downward drag to trigger a refresh
const PULL_MAX = 250;       // px cap on visible pull distance

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/funds', icon: Wallet, label: 'Funds' },
  { path: '/cards', icon: CreditCard, label: 'Cards' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/statements', icon: FileText, label: 'Statements' },
];

const SCROLL_STORAGE_KEY = 'scroll-positions';

function loadScrollPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

// Add/edit forms: horizontal swipes shouldn't switch tabs mid-form
const NO_SWIPE_ROUTE = /^\/(funds|cards)\/(new|[^/]+\/edit)$/;

const SWIPE_THRESHOLD = 30;  // px — responsive on mobile
const SWIPE_RATIO = 1.0;    // deltaX just needs to be > deltaY
const WHEEL_THRESHOLD = 40; // deltaX pixels for trackpad horizontal swipe

function LayoutInner() {
  const location = useLocation();
  const { pathname } = location;
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const { isGlobalSwipeEnabled } = useSwipeGesture();
  const swipeAllowedRef = useRef(true);
  swipeAllowedRef.current = !NO_SWIPE_ROUTE.test(pathname);

  // ─── Scroll restoration ───
  // Remember the scroll position of each history entry. Back/forward and a
  // page refresh (both POP) restore it; opening a new page starts at the top.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>(loadScrollPositions());
  const locationKeyRef = useRef(location.key);
  locationKeyRef.current = location.key;
  const saveFrame = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (saveFrame.current !== null) return;
    saveFrame.current = requestAnimationFrame(() => {
      saveFrame.current = null;
      const el = scrollRef.current;
      if (!el) return;
      scrollPositions.current[locationKeyRef.current] = el.scrollTop;
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(scrollPositions.current));
      } catch { /* storage unavailable — keep in memory only */ }
    });
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = navigationType === 'POP' ? scrollPositions.current[location.key] ?? 0 : 0;
    el.scrollTop = target;
    if (target === 0) return;

    // Content (cached data, charts) may still be laying out — keep retrying
    // for a short while until the page is tall enough to reach the position.
    // Stop as soon as the user scrolls themselves.
    let frame = 0;
    let tries = 0;
    const stop = () => cancelAnimationFrame(frame);
    const retry = () => {
      if (Math.abs(el.scrollTop - target) <= 1 || tries++ > 30) return;
      el.scrollTop = target;
      frame = requestAnimationFrame(retry);
    };
    frame = requestAnimationFrame(retry);
    el.addEventListener('touchstart', stop, { once: true, passive: true });
    el.addEventListener('wheel', stop, { once: true, passive: true });
    return () => {
      stop();
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('wheel', stop);
    };
  }, [location.key, navigationType]);

  // ─── Shared state for touch gestures ───
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const tracking = useRef(false);
  const navigated = useRef(false);
  // Captured once at touchstart — locked for the entire gesture so inner
  // components' enableGlobalSwipe() in their onTouchEnd can't re-enable mid-gesture
  const gestureAllowed = useRef(false);

  // Wheel cooldown to debounce rapid trackpad events
  const wheelCooldown = useRef(false);
  const wheelTimeout = useRef<any>(null);

  // ─── Pull-to-refresh state ───
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const pullStartY = useRef<number | null>(null);

  const updatePullDistance = useCallback((value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  }, []);

  const prevPathname = useRef(pathname);
  if (prevPathname.current !== pathname) {
    prevPathname.current = pathname;
    wheelCooldown.current = true;
    if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    wheelTimeout.current = setTimeout(() => { wheelCooldown.current = false; }, 250);
  }

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const currentIndex = tabs.findIndex(t => isActive(t.path));
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const doNavigate = useCallback((direction: 'left' | 'right') => {
    if (navigated.current) return;
    navigated.current = true;
    const idx = currentIndexRef.current;
    if (direction === 'left' && idx + 1 < tabs.length) {
      navigate(tabs[idx + 1].path);
    } else if (direction === 'right' && idx - 1 >= 0) {
      navigate(tabs[idx - 1].path);
    }
  }, [navigate]);

  const checkAndNavigate = useCallback(() => {
    if (!gestureAllowed.current) return;
    const deltaX = startX.current - lastX.current;
    const deltaY = startY.current - lastY.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_RATIO) {
      doNavigate(deltaX > 0 ? 'left' : 'right');
    }
  }, [doNavigate]);

  // ─── Touch events (mobile PWA) ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Capture enabled state NOW — inner components have already called
    // disableGlobalSwipe() in their onTouchStart (React bubbles inner→outer).
    gestureAllowed.current = swipeAllowedRef.current && isGlobalSwipeEnabled();
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    lastX.current = e.touches[0].clientX;
    lastY.current = e.touches[0].clientY;
    tracking.current = true;
    navigated.current = false;

    // Only arm pull-to-refresh when starting at the top of the scroll
    // container — otherwise this is just a normal scroll gesture.
    const scrollEl = e.currentTarget as HTMLElement;
    pullStartY.current = (!isRefreshingRef.current && scrollEl.scrollTop <= 1 && e.touches[0].clientY < 150)
      ? e.touches[0].clientY
      : null;
  }, [isGlobalSwipeEnabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current || navigated.current) return;
    lastX.current = e.touches[0].clientX;
    lastY.current = e.touches[0].clientY;

    if (pullStartY.current !== null) {
      const distanceY = e.touches[0].clientY - pullStartY.current;
      const distanceX = lastX.current - startX.current;
      if (distanceY > 0 && distanceY > Math.abs(distanceX) * 1.5) {
        updatePullDistance(Math.min(distanceY, PULL_MAX));
      } else if (Math.abs(distanceX) > 30) {
        pullStartY.current = null;
        updatePullDistance(0);
      }
    }

    checkAndNavigate();
  }, [checkAndNavigate, updatePullDistance]);

  const handleTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;

    if (pullStartY.current !== null) {
      if (pullDistanceRef.current > PULL_THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        window.location.reload();
      }
      pullStartY.current = null;
      updatePullDistance(0);
    }

    if (navigated.current) return;
    checkAndNavigate();
  }, [checkAndNavigate, updatePullDistance]);

  // ─── Wheel events (desktop 2-finger trackpad swipe) ───
  // Calendar and Statements call e.stopPropagation() in their own
  // onWheel handlers so this never fires on those screens.
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (wheelCooldown.current) {
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => { wheelCooldown.current = false; }, 250);
      return;
    }
    if (!swipeAllowedRef.current || !isGlobalSwipeEnabled()) return;

    // Only trigger on clearly horizontal trackpad swipes
    if (Math.abs(e.deltaX) > WHEEL_THRESHOLD && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
      wheelCooldown.current = true;
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => { wheelCooldown.current = false; }, 250);
      navigated.current = false;
      doNavigate(e.deltaX > 0 ? 'left' : 'right');
    }
  }, [isGlobalSwipeEnabled, doNavigate]);

  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div className="w-full h-screen max-w-md relative flex flex-col bg-background/50 sm:border-x sm:border-white/5">

        {/* Pull-to-refresh indicator */}
        <div
          className="absolute left-0 right-0 top-0 flex justify-center items-center overflow-hidden transition-all duration-300 z-20 bg-background"
          style={{ height: pullDistance > 0 ? pullDistance : isRefreshing ? 60 : 0 }}
        >
          <Loader2
            className={cn('w-6 h-6 text-muted-foreground', isRefreshing && 'animate-spin')}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>

        {/* Main Content */}
        <div
          id="main-scroll-container"
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pb-[80px] custom-scrollbar relative z-10 w-full sm:px-1 transition-transform duration-200"
          style={{ touchAction: 'pan-y', transform: `translateY(${isRefreshing ? 60 : pullDistance}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <nav
            className="relative bg-card/95 backdrop-blur-xl border-t border-border flex justify-between items-center px-4 pt-2 w-full max-w-md"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', minHeight: '64px' }}
          >
            {typeof __BUILD_TIME__ !== 'undefined' && (
              <p className="absolute bottom-1 right-2 text-[7px] font-mono text-muted-foreground/20 pointer-events-none select-none">
                {new Date(__BUILD_TIME__).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {tabs.map(tab => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-2 px-2 flex-1 rounded-xl transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-white/90'
                  )}
                >
                  <tab.icon className={cn("w-6 h-6 z-10 transition-transform duration-300", active ? "scale-110 drop-shadow-sm" : "")} />
                  <span className={cn("text-[10px] z-10", active ? "opacity-100 font-semibold" : "font-medium opacity-80")}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <SwipeGestureProvider>
      <LayoutInner />
    </SwipeGestureProvider>
  );
}