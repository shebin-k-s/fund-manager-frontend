import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/funds', icon: Wallet, label: 'Funds' },
  { path: '/cards', icon: CreditCard, label: 'Cards' },
];

export default function Layout() {
  const { pathname } = useLocation();
  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <div className="min-h-screen w-full bg-background flex justify-center">
      <div className="w-full h-screen max-w-md relative flex flex-col bg-background/50 sm:border-x sm:border-white/5">
        
        {/* Main Content */}
        {/* Prevent bottom overlap with a large bottom padding (pb-[80px]) on the scrolling element instead of mb */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto pb-[80px] custom-scrollbar relative z-10 w-full sm:px-1">
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full max-w-md z-50">
          <nav className="bg-card/95 backdrop-blur-xl border-t border-border flex justify-between items-center px-4 pb-safe pt-2 h-[72px]">
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