import { Cloud, Loader2, RefreshCw } from 'lucide-react';
import type { PfStatus } from '../api/pfApi';
import type { usePfSync } from '../hooks/usePf';

// Shown while Drive is not ready (not connected, no folder, or nothing read yet). It names the one next step
// and offers it, so setup never depends on finding the gear icon.
export function PfSetupCard({ status, sync, onOpenSettings }: { status: PfStatus; sync: ReturnType<typeof usePfSync>; onOpenSettings: () => void }) {
  let title: string;
  let text: string;
  let button: string;
  let run: () => void = onOpenSettings;
  if (!status.configured) {
    title = "Google Drive isn't set up";
    text = 'The server needs the Google keys first.';
    button = 'See details';
  } else if (!status.connected) {
    title = 'Read your payslips from Google Drive';
    text = 'Connect once and your PF fills in from your payslips.';
    button = 'Set up';
  } else if (!status.folderId) {
    title = 'Choose your payslip folder';
    text = 'Paste the link to the folder that holds all your companies.';
    button = 'Add folder';
  } else {
    title = 'Ready to read your payslips';
    text = 'Sync reads every payslip in the folder.';
    button = 'Sync now';
    run = () => sync.mutate(false);
  }
  const syncing = sync.isPending;

  return (
    <section className="glass-card p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Cloud className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{text}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={syncing}
        className="mt-4 w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
      >
        {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading payslips…</> : button === 'Sync now' ? <><RefreshCw className="w-4 h-4" /> {button}</> : button}
      </button>
    </section>
  );
}
