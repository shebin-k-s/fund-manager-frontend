import { format } from 'date-fns';

// Whole amounts show no decimals (1,800); an amount with paise always shows both digits (1,161.30).
const hasPaise = (x: number) => Math.round(x * 100) % 100 !== 0;
export const inr = (n: number | string | null) =>
  n === null ? '—' : `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: hasPaise(Number(n)) ? 2 : 0, maximumFractionDigits: 2 })}`;
// The same rule for text typed into an input: "1800.00" -> "1800", "89.98" stays.
export const plainAmount = (n: string | number | null): string => {
  if (n === null || n === '') return '';
  const x = Number(n);
  return hasPaise(x) ? x.toFixed(2) : String(Math.round(x));
};
export const monthLabel = (ym: string) => format(new Date(`${ym}-01T00:00:00`), 'MMM yyyy');
export const companyLabel = (company: string) => company || 'Other';

export const fullMonthName = (ym: string) => format(new Date(`${ym}-01T00:00:00`), 'MMMM');
export const yearOf = (ym: string) => ym.slice(0, 4);

// The data-viz palette's categorical slots, stepped for a dark surface and validated against this app's card colour.
const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const MUTED = '#8b8b94'; // a company with no slot left, or none at all

/**
 * A company keeps its colour for good: slots go to companies in the order they started, so a new employer
 * takes the next free colour instead of repainting the others.
 */
export function companyColors(companies: { company: string; from: string }[]): Map<string, string> {
  const colors = new Map<string, string>();
  [...companies]
    .filter((c) => c.company)
    .sort((a, b) => a.from.localeCompare(b.from))
    .forEach((c, i) => colors.set(c.company, SERIES[i] ?? MUTED));
  return colors;
}

export const colorOf = (colors: Map<string, string>, company: string) => colors.get(company) ?? MUTED;
