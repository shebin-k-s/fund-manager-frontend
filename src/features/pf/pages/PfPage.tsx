import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNowStrict } from 'date-fns';
import { ArrowLeft, Plus, RefreshCw, Settings } from 'lucide-react';
import { usePfStatus, usePfSummary, usePfRecords, usePfSync } from '../hooks/usePf';
import { CompanyRow } from '../components/CompanyRow';
import { DriveSheet } from '../components/DriveSheet';
import { PfSetupCard } from '../components/PfSetupCard';
import { PfAlertsCard } from '../components/PfAlertsCard';
import { RecordSheet } from '../components/RecordSheet';
import { ShareBar } from '../components/ShareBar';
import { SyncResultCard } from '../components/SyncResultCard';
import { DataFreshnessIndicator } from '@/components/DataFreshnessIndicator';
import { useQueryFreshness } from '@/hooks/useQueryFreshness';
import { combineFreshness } from '../utils/combineFreshness';
import { cn } from '@/lib/utils';
import { colorOf, companyColors, inr } from '../utils/pfFormat';

export default function PfPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const status = usePfStatus();
  const summary = usePfSummary();
  const records = usePfRecords();
  const sync = usePfSync();
  const freshness = combineFreshness(useQueryFreshness(status), useQueryFreshness(summary), useQueryFreshness(records));
  const [adding, setAdding] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);

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
  const byCompany = useMemo(() => s?.byCompany ?? [], [s]);
  const colors = useMemo(() => companyColors(byCompany), [byCompany]);
  const companyNames = byCompany.map((c) => c.company);
  // The bar reads like a career, oldest employer first; the list below puts the current one first.
  const barItems = useMemo(
    () => [...byCompany].sort((a, b) => a.from.localeCompare(b.from)).filter((c) => c.total > 0).map((c) => ({ company: c.company, total: c.total, color: colorOf(colors, c.company) })),
    [byCompany, colors],
  );

  // Setup comes first until Drive is connected, has a folder and has produced records.
  const needsSetup = !!status.data && (!status.data.connected || !status.data.folderId || (records.data ?? []).length === 0);
  const loading = summary.isLoading || records.isLoading;

  // The line under the title says whether syncing is possible and when it last ran.
  const st = status.data;
  const canSync = !!st && st.configured && st.connected && !!st.folderId;
  const syncLine = sync.isPending
    ? 'Syncing…'
    : !st
      ? ''
      : !st.configured || !st.connected
        ? 'Drive not connected'
        : !st.folderId
          ? 'Add a payslip folder'
          : st.lastStatus === 'error'
            ? 'Last sync failed'
            : st.lastSyncAt
              ? `Synced ${formatDistanceToNowStrict(new Date(st.lastSyncAt), { addSuffix: true })}`
              : 'Not synced yet';

  return (
    <div className="animate-fade-in mb-6">
      <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Provident Fund</h1>
          <div className="flex items-center gap-1.5 min-w-0">
            {!loading && <DataFreshnessIndicator status={freshness.status} isFetching={freshness.isFetching} />}
            {syncLine && <p className={cn('text-[11px] truncate', st?.lastStatus === 'error' && !sync.isPending ? 'text-destructive' : 'text-muted-foreground')}>{syncLine}</p>}
          </div>
        </div>
        {canSync && (
          <button onClick={() => sync.mutate(false)} disabled={sync.isPending} aria-label="Sync payslips" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground disabled:opacity-60">
            <RefreshCw className={cn('w-4 h-4', sync.isPending && 'animate-spin')} />
          </button>
        )}
        <button onClick={() => setDriveOpen(true)} aria-label="Google Drive settings" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
          <Settings className="w-4 h-4" />
        </button>
        <button onClick={() => setAdding(true)} aria-label="Add a month" className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="page-content !space-y-6">
        {needsSetup && status.data && <PfSetupCard status={status.data} sync={sync} onOpenSettings={() => setDriveOpen(true)} />}

        <section className="glass-card p-5">
          {loading ? (
            <div className="h-36 rounded-xl bg-secondary/60 animate-pulse" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Total PF</p>
              <p className="text-4xl font-bold tracking-tight mt-1">{inr(s?.total ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {byCompany.length} compan{byCompany.length === 1 ? 'y' : 'ies'} · {s?.months ?? 0} months
              </p>
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/[0.06]">
                <div>
                  <p className="text-xs text-muted-foreground">Your share</p>
                  <p className="text-base font-semibold mt-1">{inr(s?.employeeTotal ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employer share</p>
                  <p className="text-base font-semibold mt-1">{inr(s?.employerTotal ?? 0)}</p>
                </div>
              </div>
              {barItems.length > 1 && (
                <div className="mt-5">
                  <ShareBar items={barItems} total={barItems.reduce((n, i) => n + i.total, 0)} />
                </div>
              )}
            </>
          )}
        </section>

        <SyncResultCard result={sync.data} onDismiss={() => sync.reset()} />

        <PfAlertsCard alerts={s?.alerts ?? []} onOpen={(a) => navigate(`/pf/company?name=${encodeURIComponent(a.company)}&month=${a.type === 'missing' ? a.from : a.month}`)} />

        <section className="space-y-3">
          <h2 className="text-sm font-bold px-1">Companies</h2>
          {loading ? (
            <div className="h-48 rounded-3xl bg-secondary/60 animate-pulse" />
          ) : byCompany.length === 0 ? (
            <p className="text-xs text-muted-foreground glass-card p-5">No PF records yet. Connect Google Drive and sync, or add a month with the + button.</p>
          ) : (
            <div className="glass-card overflow-hidden divide-y divide-white/[0.06]">
              {byCompany.map((c) => (
                <CompanyRow
                  key={c.company || 'other'}
                  summary={c}
                  color={colorOf(colors, c.company)}
                  isCurrent={c.to === s?.latestMonth}
                  onOpen={() => navigate(`/pf/company?name=${encodeURIComponent(c.company)}`)}
                />
              ))}
            </div>
          )}
        </section>

      </div>

      {driveOpen && <DriveSheet status={status.data} sync={sync} onClose={() => setDriveOpen(false)} />}
      {adding && <RecordSheet record={null} defaultCompany={companyNames[0] ?? ''} companies={companyNames} onClose={() => setAdding(false)} />}
    </div>
  );
}
