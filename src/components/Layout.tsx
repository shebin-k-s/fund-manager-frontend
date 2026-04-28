import { useCallback, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, CalendarDays, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeGestureProvider, useSwipeGesture } from '@/context/SwipeGestureContext';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/funds', icon: Wallet, label: 'Funds' },
  { path: '/cards', icon: CreditCard, label: 'Cards' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/statements', icon: FileText, label: 'Statements' },
];

const SWIPE_THRESHOLD = 50;
const SWIPE_RATIO = 1.2;

function LayoutInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isGlobalSwipeEnabled } = useSwipeGesture();

  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const tracking = useRef(false);
  const navigated = useRef(false);

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
    if (!isGlobalSwipeEnabled()) return;
    const deltaX = startX.current - lastX.current;
    const deltaY = startY.current - lastY.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_RATIO) {
      doNavigate(deltaX > 0 ? 'left' : 'right');
    }
  }, [isGlobalSwipeEnabled, doNavigate]);

  // ─── Touch events (mobile) ───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    lastX.current = e.touches[0].clientX;
    lastY.current = e.touches[0].clientY;
    tracking.current = true;
    navigated.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current || navigated.current) return;
    lastX.current = e.touches[0].clientX;
    lastY.current = e.touches[0].clientY;
    checkAndNavigate();
  }, [checkAndNavigate]);

  const handleTouchEnd = useCallback(() => {
    if (!tracking.current) return;
    tracking.current = false;
    if (navigated.current) return;
    checkAndNavigate();
  }, [checkAndNavigate]);

  // ─── Mouse events (desktop / DevTools without touch emulation) ───
  const mouseDown = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    mouseDown.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    navigated.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDown.current || navigated.current) return;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    checkAndNavigate();
  }, [checkAndNavigate]);

  const handleMouseUp = useCallback(() => {
    if (!mouseDown.current) return;
    mouseDown.current = false;
    if (navigated.current) return;
    checkAndNavigate();
  }, [checkAndNavigate]);

  const handleMouseLeave = useCallback(() => {
    mouseDown.current = false;
  }, []);

  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div className="w-full h-screen max-w-md relative flex flex-col bg-background/50 sm:border-x sm:border-white/5">

        {/* Main Content */}
        <div
          id="main-scroll-container"
          className="flex-1 overflow-y-auto pb-[80px] custom-scrollbar relative z-10 w-full sm:px-1"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <nav
            className="bg-card/95 backdrop-blur-xl border-t border-border flex justify-between items-center px-4 pt-2 w-full max-w-md"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', minHeight: '64px' }}
          >
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