import { ChevronRight } from 'lucide-react';
import type { PfSummary } from '../api/pfApi';
import { companyLabel, inr, monthLabel } from '../utils/pfFormat';

type CompanySummary = PfSummary['byCompany'][number];

// One employer on the main page: a single quiet row. Tapping it opens that company's own page.
export function CompanyRow({ summary: c, color, isCurrent, onOpen }: { summary: CompanySummary; color: string; isCurrent: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-white/[0.03] transition-colors">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{companyLabel(c.company)}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {monthLabel(c.from)} – {isCurrent ? 'Present' : monthLabel(c.to)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{inr(c.total)}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{c.months} months</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
