import { Link } from 'react-router-dom';
import { PiggyBank, ChevronRight } from 'lucide-react';
import { usePfSummary } from '../hooks/usePf';
import { inr } from '../utils/pfFormat';
import { cn } from '@/lib/utils';

// Total PF with a link to the PF page. Shown on the dashboard and the Funds page.
export function PfSummaryCard({ className }: { className?: string }) {
  const { data } = usePfSummary();
  const months = data?.months ?? 0;

  return (
    <Link to="/pf" className={cn('glass-card p-4 flex items-center gap-3.5 active:scale-[0.99] transition-transform', className)}>
      <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <PiggyBank className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Provident Fund</p>
        <p className="text-lg font-bold truncate">
          {inr(data?.total ?? 0)}
        </p>
        <p className="text-[11px] text-muted-foreground">Total across {months} month{months === 1 ? '' : 's'}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}
