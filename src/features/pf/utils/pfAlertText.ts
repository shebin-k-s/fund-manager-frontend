import type { PfAlert } from '../api/pfApi';
import { companyLabel, inr, monthLabel } from './pfFormat';

type Missing = Extract<PfAlert, { type: 'missing' }>;
type Change = Extract<PfAlert, { type: 'change' }>;

export const missingTitle = (a: Missing) => (a.count === 1 ? `${monthLabel(a.from)} not recorded` : `${monthLabel(a.from)} – ${monthLabel(a.to)} not recorded`);
export const changeTitle = (a: Change) => `PF ${a.pct > 0 ? 'up' : 'down'} ${Math.abs(a.pct)}% in ${monthLabel(a.month)}`;
export const changeNote = (a: Change) => `${a.pct > 0 ? 'Up' : 'Down'} ${Math.abs(a.pct)}% from ${monthLabel(a.previousMonth)} (${inr(a.previous)} → ${inr(a.current)})`;

export function alertTitle(a: PfAlert): string {
  return a.type === 'missing' ? missingTitle(a) : changeTitle(a);
}

// The second line on the main page's alert list.
export function alertDetail(a: PfAlert): string {
  const who = companyLabel(a.company);
  if (a.type === 'change') return `${who} · ${inr(a.previous)} → ${inr(a.current)}`;
  return `${who} · ${a.trailing ? 'no payslip read yet' : `${a.count} month${a.count === 1 ? '' : 's'} missing`}`;
}
