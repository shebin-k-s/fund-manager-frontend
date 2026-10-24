import { useState } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { PfAlert } from '../api/pfApi';
import { alertDetail, alertTitle } from '../utils/pfAlertText';

// Months with no record and amounts that jumped or dropped. Nothing is drawn when everything looks normal.
export function PfAlertsCard({ alerts, onOpen }: { alerts: PfAlert[]; onOpen: (alert: PfAlert) => void }) {
  const [all, setAll] = useState(false);
  if (alerts.length === 0) return null;
  const shown = all ? alerts : alerts.slice(0, 3);

  return (
    <section className="rounded-3xl border border-amber-400/30 bg-amber-400/[0.07] p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <h2 className="text-sm font-bold">{alerts.length} thing{alerts.length === 1 ? '' : 's'} to check</h2>
      </div>
      <div className="mt-2 divide-y divide-white/[0.06]">
        {shown.map((a, i) => (
          <button key={`${a.type}-${a.company}-${a.type === 'missing' ? a.from : a.month}-${i}`} type="button" onClick={() => onOpen(a)} className="w-full flex items-center gap-3 py-3 text-left">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alertTitle(a)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alertDetail(a)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
      {alerts.length > 3 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-1 text-xs font-semibold text-amber-400">
          {all ? 'Show fewer' : `Show all ${alerts.length}`}
        </button>
      )}
    </section>
  );
}
