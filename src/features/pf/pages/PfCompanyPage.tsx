import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import type { PfAlert, PfRecord } from '../api/pfApi';
import { usePfRecords, usePfSummary, useDeletePfRecord, useReviewPfRecord } from '../hooks/usePf';
import { RecordSheet } from '../components/RecordSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { companyLabel, fullMonthName, inr, monthLabel, yearOf } from '../utils/pfFormat';
import { changeNote, missingTitle } from '../utils/pfAlertText';

type Missing = Extract<PfAlert, { type: 'missing' }>;
type Change = Extract<PfAlert, { type: 'change' }>;
// A recorded month (maybe flagged) or a stretch of months with no record, in one list.
type Item = { kind: 'record'; key: string; record: PfRecord; flag?: Change } | { kind: 'gap'; key: string; gap: Missing };

// One employer: its totals, then every month under its calendar year.
export default function PfCompanyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const name = params.get('name'); // '' is a real value: payslips with no company folder
  const targetMonth = params.get('month'); // set when arriving from an alert: scroll to that month
  const summary = usePfSummary();
  const records = usePfRecords();
  const remove = useDeletePfRecord();
  const review = useReviewPfRecord();
  const [sheet, setSheet] = useState<{ record: PfRecord | null; month?: string } | null>(null);
  const [deleting, setDeleting] = useState<PfRecord | null>(null);

  const mine = useMemo(() => (records.data ?? []).filter((r) => r.company === name), [records.data, name]);
  const c = summary.data?.byCompany.find((x) => x.company === name);
  const companies = (summary.data?.byCompany ?? []).map((x) => x.company);

  // Everything of this company was deleted (or the link is bad): nothing left to show here.
  useEffect(() => {
    if (name === null || (records.isSuccess && summary.isSuccess && mine.length === 0 && !sheet)) navigate('/pf', { replace: true });
  }, [name, records.isSuccess, summary.isSuccess, mine.length, sheet, navigate]);

  const alerts = useMemo(() => (summary.data?.alerts ?? []).filter((a) => a.company === name), [summary.data, name]);

  const years = useMemo(() => {
    const items: Item[] = mine.map((record) => ({
      kind: 'record',
      key: record.month,
      record,
      flag: alerts.find((a): a is Change => a.type === 'change' && a.month === record.month),
    }));
    for (const a of alerts) if (a.type === 'missing') items.push({ kind: 'gap', key: a.to, gap: a });
    items.sort((x, y) => y.key.localeCompare(x.key));

    const groups: { year: string; items: Item[]; total: number }[] = [];
    for (const it of items) {
      const year = yearOf(it.key);
      let g = groups[groups.length - 1];
      if (!g || g.year !== year) {
        g = { year, items: [], total: 0 };
        groups.push(g);
      }
      g.items.push(it);
      if (it.kind === 'record') g.total += Number(it.record.employeePf) + Number(it.record.employerPf ?? 0);
    }
    return groups;
  }, [mine, alerts]);

  const scrolled = useRef(false);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!targetMonth || scrolled.current || years.length === 0) return;
    const el =
      document.querySelector<HTMLElement>(`[data-month="${targetMonth}"]`) ??
      [...document.querySelectorAll<HTMLElement>('[data-from]')].find((e) => e.dataset.from! <= targetMonth && targetMonth <= e.dataset.to!);
    if (!el) return;
    scrolled.current = true; // once per visit: later edits must not pull the page back up or down
    el.scrollIntoView({ block: 'center' });
    setFlash(targetMonth);
  }, [targetMonth, years]);
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(timer);
  }, [flash]);

  if (name === null) return null;
  const flagFor = (r: PfRecord | null) => (r ? alerts.find((a): a is Change => a.type === 'change' && a.month === r.month) : undefined);
  const isCurrent = !!c && c.to === summary.data?.latestMonth;

  return (
    <div className="animate-fade-in mb-6">
      <div className="page-header sticky top-0 z-20 bg-background flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-secondary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Provident Fund</p>
          <h1 className="text-xl font-bold truncate">{companyLabel(name)}</h1>
        </div>
        <button onClick={() => setSheet({ record: null })} aria-label="Add a month" className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="page-content !space-y-6">
        {c && (
          <section className="glass-card p-5">
            <p className="text-xs text-muted-foreground">Total PF</p>
            <p className="text-4xl font-bold tracking-tight mt-1">{inr(c.total)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {c.months} months · {monthLabel(c.from)} – {isCurrent ? 'Present' : monthLabel(c.to)}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/[0.06]">
              <div>
                <p className="text-xs text-muted-foreground">Your share</p>
                <p className="text-base font-semibold mt-1">{inr(c.employee)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employer share</p>
                <p className="text-base font-semibold mt-1">{inr(c.employer)}</p>
              </div>
            </div>
          </section>
        )}

        {years.map((y) => (
          <section key={y.year} className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-bold">{y.year}</h2>
              <span className="text-xs text-muted-foreground">{inr(y.total)}</span>
            </div>
            <div className="glass-card overflow-hidden divide-y divide-white/[0.06]">
              {y.items.map((it) =>
                it.kind === 'gap' ? (
                  <button key={`gap-${it.key}`} type="button" data-from={it.gap.from} data-to={it.gap.to} onClick={() => setSheet({ record: null, month: it.gap.from })} className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-amber-400/[0.07] active:bg-amber-400/[0.12] transition-shadow ${flash && it.gap.from <= flash && flash <= it.gap.to ? 'ring-2 ring-inset ring-amber-400/70' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-amber-300">{missingTitle(it.gap)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{it.gap.trailing ? 'No payslip read yet' : 'No record'} · tap to add</p>
                    </div>
                    <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                  </button>
                ) : (
                  <button key={it.record.id} type="button" data-month={it.record.month} onClick={() => setSheet({ record: it.record })} className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left active:bg-white/[0.03] transition-shadow ${it.flag ? 'border-l-2 border-amber-400' : ''} ${flash === it.record.month ? 'ring-2 ring-inset ring-amber-400/70' : ''}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{fullMonthName(it.record.month)}</p>
                      {it.flag ? (
                        <p className="text-[11px] text-amber-300 mt-0.5">Was {inr(it.flag.previous)} in {monthLabel(it.flag.previousMonth)}</p>
                      ) : (
                        it.record.edited && <p className="text-[11px] text-muted-foreground mt-0.5">Edited by hand</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{inr(Number(it.record.employeePf) + Number(it.record.employerPf ?? 0))}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{it.record.employerPf === null ? 'Your share only' : `${inr(it.record.employeePf)} + ${inr(it.record.employerPf)}`}</p>
                    </div>
                  </button>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      {sheet && (
        <RecordSheet
          record={sheet.record}
          defaultCompany={name}
          defaultMonth={sheet.month}
          companies={companies}
          notice={flagFor(sheet.record) ? changeNote(flagFor(sheet.record)!) : undefined}
          onReview={flagFor(sheet.record) ? () => { review.mutate(sheet.record!.id); setSheet(null); } : undefined}
          onClose={() => setSheet(null)}
          onDelete={sheet.record ? () => { setDeleting(sheet.record); setSheet(null); } : undefined}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        title="Delete this month?"
        description={deleting ? `${monthLabel(deleting.month)} is removed from your PF total. A later sync can add it back from the payslip.` : ''}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        isPending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  );
}
