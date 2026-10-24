import { useState } from 'react';
import { inr, companyLabel } from '../utils/pfFormat';

export interface ShareItem {
  company: string;
  total: number;
  color: string;
}

// One bar split by company, oldest employer on the left. Tap or hover a part to read it underneath; the
// company cards below carry the same colours as a legend.
export function ShareBar({ items, total }: { items: ShareItem[]; total: number }) {
  const [active, setActive] = useState<number | null>(null);
  const shown = active === null ? null : items[active];
  const pct = (n: number) => Math.round((n / total) * 1000) / 10;

  return (
    <div className="space-y-1">
      <div className="flex gap-[2px]" role="group" aria-label="Share of total PF by company">
        {items.map((it, i) => (
          <button
            key={it.company || 'other'}
            type="button"
            aria-label={`${companyLabel(it.company)}: ${inr(it.total)}, ${pct(it.total)}%`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onClick={() => setActive(active === i ? null : i)}
            className="h-6 flex items-center transition-opacity"
            style={{ width: `${(it.total / total) * 100}%`, minWidth: 6, opacity: active === null || active === i ? 1 : 0.35 }}
          >
            <span className="block w-full h-2.5 rounded-[4px]" style={{ background: it.color }} />
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground min-h-[16px] flex items-center gap-1.5">
        {shown ? (
          <>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: shown.color }} />
            <span className="font-semibold text-foreground truncate">{companyLabel(shown.company)}</span>
            <span className="shrink-0">· {inr(shown.total)} · {pct(shown.total)}%</span>
          </>
        ) : (
          'Share of total by company'
        )}
      </p>
    </div>
  );
}
