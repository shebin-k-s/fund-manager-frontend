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
    <div className="h-screen bg-background max-w-lg mx-auto relative flex flex-col">
      {/* Main Content - Takes remaining height after accounting for bottom nav */}
      <div
        className="flex-1 overflow-y-auto mb-16 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Outlet />
      </div>

      {/* Bottom Navigation - Fixed height */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border h-16">
        <div className="flex justify-around items-center h-full max-w-lg mx-auto">
          {tabs.map(tab => (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors rounded-lg flex-1 h-full',
                isActive(tab.path)
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}