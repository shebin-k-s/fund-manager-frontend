import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, ChevronDown, Cloud, ExternalLink, Info, Loader2, RefreshCw } from 'lucide-react';
import type { PfStatus } from '../api/pfApi';
import { BottomSheet } from './BottomSheet';
import { useConnectPfDrive, useDisconnectPfDrive, useSetPfFolder, type usePfSync } from '../hooks/usePf';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

const PRIMARY_BUTTON =
  'w-full py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground';
const INPUT = 'w-full rounded-xl bg-secondary/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';

// The layout the scan expects, drawn so it can be matched against the user's own Drive.
// With a title it sits on the same line as that label, on the right; without one it stands alone.
function FolderLayoutHint({ title }: { title?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        {title && <label className="text-xs font-semibold">{title}</label>}
        <button type="button" aria-expanded={show} onClick={() => setShow(!show)} className="flex items-center gap-1 text-xs font-semibold text-primary">
          <Info className="w-3.5 h-3.5" />
          Folder layout
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', show && 'rotate-180')} />
        </button>
      </div>
      {show && (
        <div className="rounded-xl bg-secondary/60 px-3.5 py-3 space-y-2">
          <pre className="text-[11px] leading-5 text-muted-foreground font-mono overflow-x-auto">{`Payslips        ← paste its link
├─ Company A    ← company name
│  └─ 2025
│     └─ payslip.pdf
└─ Company B
   └─ 2024
      └─ payslip.pdf`}</pre>
          <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
            <li>Each folder directly inside it is a company. Folders below that can have any names and any depth.</li>
            <li>File names can be anything. Only PDFs are read, and they must not be password-protected.</li>
            <li>The pay month is read from inside each payslip. Only if it isn't found there, the file or folder name is used instead.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Google Drive settings, opened from the gear in the page header. The everyday action, syncing, lives in the
// header; this is for connecting, choosing the folder and disconnecting.
export function DriveSheet({ status, sync, onClose }: { status: PfStatus | undefined; sync: ReturnType<typeof usePfSync>; onClose: () => void }) {
  const connect = useConnectPfDrive();
  const disconnect = useDisconnectPfDrive();
  const setFolder = useSetPfFolder();
  const [folder, setFolderText] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const summary = !status
    ? 'Loading…'
    : !status.configured
      ? 'Not set up on the server'
      : !status.connected
        ? 'Not connected'
        : status.accountEmail ?? 'Connected';

  return (
    <BottomSheet onClose={onClose}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-lg font-bold">Google Drive</Dialog.Title>
                <Dialog.Description className="text-[11px] text-muted-foreground truncate">{summary}</Dialog.Description>
              </div>
              {status?.connected && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-success/15 text-success shrink-0">Connected</span>}
              <button type="button" onClick={onClose} className="text-sm font-semibold text-primary shrink-0">Done</button>
            </div>

        <div className="space-y-3">
          {!status ? (
            <div className="h-24 rounded-xl bg-secondary/60 animate-pulse" />
          ) : !status.configured ? (
            <p className="text-xs text-muted-foreground">Google sign-in isn't set up on the server yet. It needs the same Google keys the backup uses.</p>
          ) : !status.connected ? (
            <>
              <p className="text-xs text-muted-foreground">
                Needs <span className="font-semibold text-foreground">read-only</span> access to your Google Drive. The app only opens PDFs inside the folder you choose, and can't change or delete anything.
              </p>
              <FolderLayoutHint />
              <button onClick={() => connect.mutate()} disabled={connect.isPending} className={PRIMARY_BUTTON}>
                {connect.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening Google…</> : <><Cloud className="w-4 h-4" /> Connect Google Drive</>}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs">
                Connected{status.accountEmail ? <> as <span className="font-semibold">{status.accountEmail}</span></> : null}
              </p>

              <div className="space-y-2">
                <FolderLayoutHint title="Parent folder link" />
                <p className="text-[11px] text-muted-foreground">The folder that holds all your companies.</p>
                <div className="flex gap-2">
                  <input className={INPUT} placeholder="https://drive.google.com/drive/folders/…" value={folder} onChange={(e) => setFolderText(e.target.value)} />
                  <button
                    onClick={() => setFolder.mutate(folder, { onSuccess: () => setFolderText('') })}
                    disabled={!folder.trim() || setFolder.isPending}
                    className="shrink-0 px-4 rounded-xl text-sm font-semibold bg-secondary disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
                {status.folderUrl && (
                  <a href={status.folderUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Current folder <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {status.lastStatus && (
                <div className={cn('flex items-start gap-2 rounded-xl px-3 py-2 text-xs', status.lastStatus === 'ok' ? 'bg-success/15' : 'bg-destructive/10')}>
                  {status.lastStatus === 'ok' ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                  <p className="min-w-0 break-words">
                    {status.lastStatus === 'ok' ? 'Last sync' : 'Last sync failed'}
                    {status.lastSyncAt ? ` · ${format(new Date(status.lastSyncAt), 'd MMM, h:mm a')}` : ''}
                    {status.lastMessage ? <span className="block text-muted-foreground mt-0.5">{status.lastMessage}</span> : null}
                  </p>
                </div>
              )}

              <button onClick={() => sync.mutate(false)} disabled={!status.folderId || sync.isPending} className={PRIMARY_BUTTON}>
                {sync.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading payslips…</> : <><RefreshCw className="w-4 h-4" /> Sync payslips</>}
              </button>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => sync.mutate(true)} disabled={!status.folderId || sync.isPending} className="text-xs font-semibold text-primary disabled:opacity-50">
                  Re-read all payslips
                </button>
                <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={sync.isPending} className="text-xs font-semibold text-destructive disabled:opacity-50">
                  Disconnect
                </button>
              </div>
              <ConfirmDialog
                open={confirmDisconnect}
                onCancel={() => setConfirmDisconnect(false)}
                title="Disconnect Google Drive?"
                description="The app loses access to your Drive. PF records already saved stay."
                confirmLabel="Disconnect"
                pendingLabel="Disconnecting..."
                isPending={disconnect.isPending}
                onConfirm={() => disconnect.mutate(undefined, { onSettled: () => setConfirmDisconnect(false) })}
              />
            </>
          )}
        </div>
    </BottomSheet>
  );
}
