import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SELECT = 'w-full appearance-none rounded-xl bg-secondary/60 pl-3 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';

// A month and a year as two plain dropdowns. <input type="month"> was tried first: on Android, tapping its text only
// selects the word ("October") for typing and the picker opens from a small icon, so it never behaved like a picker.
// `value` and `onChange` use 'YYYY-MM'.
export function MonthYearSelect({ value, onChange }: { value: string; onChange: (ym: string) => void }) {
  const [year, month] = value.split('-');
  const thisYear = new Date().getFullYear();
  const oldest = Math.min(2000, Number(year) || 2000);
  const years: number[] = [];
  for (let y = thisYear + 1; y >= oldest; y--) years.push(y);
  if (Number(year) > thisYear + 1) years.unshift(Number(year)); // a saved value outside the usual range stays selectable

  const arrow = <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative">
        <select aria-label="Month" value={month} onChange={(e) => onChange(`${year}-${e.target.value}`)} className={cn(SELECT)}>
          {MONTHS.map((name, i) => (
            <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
          ))}
        </select>
        {arrow}
      </div>
      <div className="relative">
        <select aria-label="Year" value={year} onChange={(e) => onChange(`${e.target.value}-${month}`)} className={cn(SELECT)}>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        {arrow}
      </div>
    </div>
  );
}
