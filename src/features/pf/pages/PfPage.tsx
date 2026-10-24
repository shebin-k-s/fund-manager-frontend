import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Cloud, ExternalLink, Loader2, RefreshCw, Plus, Pencil, Trash2, PiggyBank, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { PfRecord, PfStatus } from '../api/pfApi';
import { usePfStatus, usePfSummary, usePfRecords, useConnectPfDrive, useDisconnectPfDrive, useSetPfFolder, usePfSync, useSavePfRecord, useDeletePfRecord } from '../hooks/usePf';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

const PRIMARY_BUTTON =
  'w-full py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground';
const INPUT = 'w-full rounded-xl bg-secondary/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';

const inr = (n: number | string | null) => (n === null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
const monthLabel = (ym: string) => format(new Date(`${ym}-01T00:00:00`), 'MMM yyyy');
const companyLabel = (company: string) => company || 'Other';

function DriveSection({ status }: { status: PfStatus | undefined }) {
  const connect = useConnectPfDrive();
  const disconnect = useDisconnectPfDrive();
  const setFolder = useSetPfFolder();
  const sync = usePfSync();
  const [folder, setFolderText] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <section className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Cloud className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">Payslips from Google Drive</h2>
      </div>

      {!status ? (
        <div className="h-24 rounded-xl bg-secondary/60 animate-pulse" />
      ) : !status.configured ? (
        <p className="text-xs text-muted-foreground">Google sign-in isn't set up on the server yet. It needs the same Google keys the backup uses.</p>
      ) : !status.connected ? (
        <>
          <p className="text-xs text-muted-foreground">
            Needs <span className="font-semibold text-foreground">read-only</span> access to your Google Drive. The app only opens PDFs inside the folder you choose, and can't change or delete anything.
          </p>
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
            <label className="text-xs font-semibold">Parent folder link</label>
            <p className="text-[11px] text-muted-foreground">The folder that holds all your companies. Every folder inside it is scanned, and each company is its first folder.</p>
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

          {sync.data && sync.data.skipped.length > 0 && (
            <div className="rounded-xl bg-secondary/60 px-3 py-2 text-xs space-y-1">
              <p className="font-semibold">Couldn't read {sync.data.skipped.length} file{sync.data.skipped.length === 1 ? '' : 's'} — add these by hand:</p>
              {sync.data.skipped.map((s) => (
                <p key={s.fileName} className="text-muted-foreground break-words">{s.fileName}: {s.reason}</p>
              ))}
            </div>
          )}

          <button onClick={() => sync.mutate(false)} disabled={!status.folderId || sync.isPending} className={PRIMARY_BUTTON}>
            {sync.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading payslips…</> : <><RefreshCw className="w-4 h-4" /> Sync payslips</>}
          </button>

          <button type="button" onClick={() => sync.mutate(true)} disabled={!status.folderId || sync.isPending} className="block text-xs font-semibold text-primary disabled:opacity-50">
            Re-read all payslips
          </button>

          <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={sync.isPending} className="text-xs font-semibold text-destructive disabled:opacity-50">
            Disconnect
          </button>
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
    </section>
  );
}

function RecordForm({ record, companies, onClose }: { record: PfRecord | null; companies: string[]; onClose: () => void }) {
  const save = useSavePfRecord();
  const [company, setCompany] = useState(record?.company ?? companies[0] ?? '');
  const [month, setMonth] = useState(record?.month ?? format(new Date(), 'yyyy-MM'));
  const [employeePf, setEmployeePf] = useState(record?.employeePf ?? '');
  const [employerPf, setEmployerPf] = useState(record?.employerPf ?? '');
  const [gross, setGross] = useState(record?.gross ?? '');
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  const valid = /^\d{4}-\d{2}$/.test(month) && employeePf !== '' && !Number.isNaN(Number(employeePf));

  return (
    <section className="glass-card p-4 space-y-3">
      <h2 className="text-sm font-bold">{record ? `Edit ${monthLabel(record.month)}` : 'Add a month'}</h2>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold col-span-2">Company
          <input list="pf-companies" className={cn(INPUT, 'mt-1')} placeholder="e.g. Reizend" value={company} onChange={(e) => setCompany(e.target.value)} />
          <datalist id="pf-companies">{companies.filter(Boolean).map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="text-xs font-semibold col-span-2">Month
          <input type="month" className={cn(INPUT, 'mt-1')} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="text-xs font-semibold">Your PF
          <input inputMode="decimal" className={cn(INPUT, 'mt-1')} value={employeePf} onChange={(e) => setEmployeePf(e.target.value)} />
        </label>
        <label className="text-xs font-semibold">Employer PF
          <input inputMode="decimal" className={cn(INPUT, 'mt-1')} value={employerPf} onChange={(e) => setEmployerPf(e.target.value)} />
        </label>
        <label className="text-xs font-semibold col-span-2">Gross pay (optional)
          <input inputMode="decimal" className={cn(INPUT, 'mt-1')} value={gross} onChange={(e) => setGross(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary">Cancel</button>
        <button
          disabled={!valid || save.isPending}
          onClick={() => save.mutate({ id: record?.id ?? null, input: { company: company.trim(), month, employeePf: Number(employeePf), employerPf: num(String(employerPf)), gross: num(String(gross)) } }, { onSuccess: onClose })}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  );
}

export default function PfPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const status = usePfStatus();
  const summary = usePfSummary();
  const records = usePfRecords();
  const remove = useDeletePfRecord();
  const [editing, setEditing] = useState<PfRecord | 'new' | null>(null);
  const [deleting, setDeleting] = useState<PfRecord | null>(null);

  // Google sends the browser back here with ?drive=connected or ?drive=error&message=…
  const [params] = useSearchParams();
  useEffect(() => {
    const result = params.get('drive');
    if (!result) return;
    qc.invalidateQueries({ queryKey: ['pf'] });
    if (result === 'connected') toast.success('Google Drive connected');
    else toast.error(params.get('message') || 'Could not connect Google Drive');
    // Clears ?drive=… and drops Google's pages from the Back history.
    navigate('/', { replace: true });
    navigate('/pf');
  }, [params, navigate, qc]);

  const s = summary.data;
  const list = records.data ?? [];
  // Company order follows the summary (current employer first); each group keeps the newest month on top.
  const companies = s ? s.byCompany.map((c) => c.company) : [...new Set(list.map((r) => r.company))];
  const groups = companies.map((company) => ({ company, items: list.filter((r) => r.company === company) })).filter((g) => g.items.length > 0);

  return (
    <div className="animate-fade-in mb-4">
      <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Your savings</p>
          <h1 className="text-xl font-bold">Provident Fund</h1>
        </div>
      </div>

      <div className="page-content space-y-5">
        <section className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold">Total PF</h2>
          </div>
          <p className="text-3xl font-bold">{s ? inr(s.total) : '—'}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-secondary/60 px-3 py-2"><p className="text-muted-foreground">Your share</p><p className="font-semibold">{s ? inr(s.employeeTotal) : '—'}</p></div>
            <div className="rounded-xl bg-secondary/60 px-3 py-2"><p className="text-muted-foreground">Employer share</p><p className="font-semibold">{s ? inr(s.employerTotal) : '—'}</p></div>
          </div>
          {s && s.byCompany.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold">By company</p>
              {s.byCompany.map((c) => (
                <div key={c.company} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{companyLabel(c.company)}</p>
                    <p className="text-[11px] text-muted-foreground">{monthLabel(c.from)} – {monthLabel(c.to)} · {c.months} mo</p>
                  </div>
                  <span className="font-semibold shrink-0">{inr(c.total)}</span>
                </div>
              ))}
            </div>
          )}
          {s && s.byFinancialYear.length > 0 && (
            <div className="space-y-1 text-xs">
              {s.byFinancialYear.map((y) => (
                <div key={y.label} className="flex justify-between">
                  <span className="text-muted-foreground">FY {y.label} · {y.months} mo</span>
                  <span className="font-semibold">{inr(y.employee + y.employer)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <DriveSection status={status.data} />

        {editing ? (
          <RecordForm record={editing === 'new' ? null : editing} companies={companies} onClose={() => setEditing(null)} />
        ) : (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Monthly PF</h2>
              <button onClick={() => setEditing('new')} className="flex items-center gap-1 text-xs font-semibold text-primary"><Plus className="w-3.5 h-3.5" /> Add month</button>
            </div>
            {list.length === 0 ? (
              <p className="text-xs text-muted-foreground glass-card p-4">{records.isLoading ? 'Loading…' : 'No PF records yet. Connect Drive and sync, or add a month by hand.'}</p>
            ) : (
              groups.map((g) => (
                <div key={g.company} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground pt-1">{companyLabel(g.company)}</p>
                  {g.items.map((r) => (
                    <div key={r.id} className="glass-card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{monthLabel(r.month)}{r.edited && <span className="ml-2 text-[10px] font-medium text-muted-foreground">edited</span>}</p>
                        <p className="text-xs text-muted-foreground">You {inr(r.employeePf)} · Employer {inr(r.employerPf)}</p>
                      </div>
                      <button aria-label="Edit" onClick={() => setEditing(r)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                      <button aria-label="Delete" onClick={() => setDeleting(r)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        title="Delete this month?"
        description={deleting ? `${companyLabel(deleting.company)} · ${monthLabel(deleting.month)} is removed from your PF total. A later sync can add it back from the payslip.` : ''}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  );
}
