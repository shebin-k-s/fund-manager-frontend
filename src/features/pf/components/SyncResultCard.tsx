import { X } from 'lucide-react';
import type { PfSyncResult } from '../api/pfApi';

// What the last sync could not read, right where it can be seen. Nothing is drawn when every file was read.
export function SyncResultCard({ result, onDismiss }: { result: PfSyncResult | undefined; onDismiss: () => void }) {
  if (!result || result.skipped.length === 0) return null;
  const n = result.skipped.length;

  return (
    <section className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold">{n} file{n === 1 ? '' : 's'} couldn't be read</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Add these months by hand with the + button.</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-white/[0.06]">
        {result.skipped.map((s) => (
          <div key={s.fileName} className="py-2.5">
            <p className="text-xs font-medium break-words">{s.fileName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{s.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
