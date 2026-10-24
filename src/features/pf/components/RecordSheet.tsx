import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import type { PfRecord } from '../api/pfApi';
import { useSavePfRecord } from '../hooks/usePf';
import { BottomSheet } from './BottomSheet';
import { MonthYearSelect } from './MonthYearSelect';
import { companyLabel, monthLabel, plainAmount } from '../utils/pfFormat';
import { cn } from '@/lib/utils';

const INPUT = 'w-full rounded-xl bg-secondary/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';

interface RecordSheetProps {
  record: PfRecord | null; // null = adding
  defaultCompany: string;
  companies: string[];
  onClose: () => void;
  defaultMonth?: string;
  notice?: string; // why this month was flagged
  onReview?: () => void; // accept a flagged amount as it is
  onDelete?: () => void; // editing only
}

// Add or edit one month. Mount it to open it; it closes itself after a save.
export function RecordSheet({ record, defaultCompany, companies, onClose, defaultMonth, notice, onReview, onDelete }: RecordSheetProps) {
  const save = useSavePfRecord();
  const [company, setCompany] = useState(record?.company ?? defaultCompany);
  const [month, setMonth] = useState(record?.month ?? defaultMonth ?? format(new Date(), 'yyyy-MM'));
  const [employeePf, setEmployeePf] = useState(plainAmount(record?.employeePf ?? null));
  const [employerPf, setEmployerPf] = useState(plainAmount(record?.employerPf ?? null));
  const [gross, setGross] = useState(plainAmount(record?.gross ?? null));
  const num = (s: string) => (s.trim() === '' ? null : Number(s));
  const valid = /^\d{4}-\d{2}$/.test(month) && employeePf !== '' && !Number.isNaN(Number(employeePf));

  return (
    <BottomSheet onClose={onClose} locked={save.isPending}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" disabled={save.isPending} onClick={onClose} className="text-sm font-semibold text-muted-foreground disabled:opacity-50">Cancel</button>
        <Dialog.Title className="text-base font-bold text-center truncate">{record ? `Edit ${monthLabel(record.month)}` : 'Add a month'}</Dialog.Title>
        <button
          type="button"
          disabled={!valid || save.isPending}
          onClick={() => save.mutate({ id: record?.id ?? null, input: { company: company.trim(), month, employeePf: Number(employeePf), employerPf: num(String(employerPf)), gross: num(String(gross)) } }, { onSuccess: onClose })}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <Dialog.Description className="text-xs text-muted-foreground text-center -mt-2">
        {record ? `${companyLabel(record.company)} · a hand edit is never overwritten by a sync.` : 'Entered by hand — a sync never overwrites it.'}
      </Dialog.Description>

      {notice && <p className="rounded-xl bg-amber-400/10 border border-amber-400/25 px-3 py-2 text-xs text-amber-300">{notice}</p>}

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold col-span-2">Company
          <input list="pf-companies" className={cn(INPUT, 'mt-1')} placeholder="e.g. Reizend" value={company} onChange={(e) => setCompany(e.target.value)} />
          <datalist id="pf-companies">{companies.filter(Boolean).map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <div className="col-span-2">
          <p className="text-xs font-semibold mb-1">Month</p>
          <MonthYearSelect value={month} onChange={setMonth} />
        </div>
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

      {record && onReview && (
        <button type="button" disabled={save.isPending} onClick={onReview} className="w-full py-3 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground disabled:opacity-50">
          Looks right — mark as reviewed
        </button>
      )}

      {record && onDelete && (
        <button type="button" disabled={save.isPending} onClick={onDelete} className="w-full text-xs font-semibold text-destructive disabled:opacity-50">
          Delete this month
        </button>
      )}
    </BottomSheet>
  );
}
