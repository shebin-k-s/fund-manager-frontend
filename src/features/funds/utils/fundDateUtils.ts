import { addDays, addMonths, format, isBefore, startOfDay, getDay, getDaysInMonth } from 'date-fns';
import type { Fund } from '../types';

export function dateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function getFundPaymentDates(fund: Fund, rangeEnd?: Date): Date[] {
  const dates: Date[] = [];
  const start = startOfDay(new Date(fund.startDate));
  const end = fund.endDate
    ? startOfDay(new Date(fund.endDate))
    : rangeEnd || addMonths(new Date(), 3);

  if (fund.recurrence === 'weekly' && fund.dayOfWeek !== undefined) {
    let cur = new Date(start);
    while (getDay(cur) !== fund.dayOfWeek) cur = addDays(cur, 1);
    while (!isBefore(end, cur)) {
      dates.push(new Date(cur));
      cur = addDays(cur, 7);
    }
  } else if (fund.recurrence === 'monthly' && fund.dayOfMonth !== undefined) {
    let y = start.getFullYear(), m = start.getMonth();
    const dayInMonth = (yr: number, mo: number) => {
      const max = getDaysInMonth(new Date(yr, mo));
      return new Date(yr, mo, Math.min(fund.dayOfMonth!, max));
    };
    let first = dayInMonth(y, m);
    if (isBefore(first, start)) { m++; if (m > 11) { m = 0; y++; } }
    let cur = dayInMonth(y, m);
    while (!isBefore(end, cur)) {
      dates.push(cur);
      m++;
      if (m > 11) { m = 0; y++; }
      cur = dayInMonth(y, m);
    }
  }
  return dates;
}

export function isDatePaid(fund: Fund, date: Date): boolean {
  return fund.payments.some(p => p.date === dateKey(date));
}

export function getPaidAmount(fund: Fund, date: Date): number | undefined {
  return fund.payments.find(p => p.date === dateKey(date))?.amount;
}

export function getNextUnpaidDate(fund: Fund): Date | null {
  const today = startOfDay(new Date());
  const dates = getFundPaymentDates(fund, addMonths(today, 3));
  return dates.find(d => !isBefore(d, today) && !isDatePaid(fund, d)) || null;
}

export function getMissedCount(fund: Fund): number {
  const today = startOfDay(new Date());
  const dates = getFundPaymentDates(fund);
  return dates.filter(d => isBefore(d, today) && !isDatePaid(fund, d)).length;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
