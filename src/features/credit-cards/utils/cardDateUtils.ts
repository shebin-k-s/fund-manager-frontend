import {
  addMonths,
  getDaysInMonth,
  isBefore,
  startOfDay,
  isAfter,
  isSameMonth,
  format,
  differenceInDays,
} from 'date-fns';
import type { CreditCard, BillingCycle } from '../types';

/**
 * Generates a consistent cycle ID from year and month
 */
export function generateCycleId(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Parses a cycle ID into year and month
 */
export function parseCycleId(cycleId: string): { year: number; month: number } {
  const [year, month] = cycleId.split('-').map(Number);
  return { year, month: month - 1 };
}

/**
 * Gets the last day of a given month
 */
function getLastDayOfMonth(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month));
}

/**
 * Validates if a bill/due date is valid for a given month
 */
function validateDate(day: number, year: number, month: number): number {
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(day, lastDay);
}

/**
 * Gets all billing cycles for a credit card
 * Only includes cycles where bill date has occurred or is current month
 */
export function getBillingCycles(card: CreditCard, rangeEnd?: Date): BillingCycle[] {
  const startFrom = card.billingStartDate
    ? startOfDay(new Date(card.billingStartDate))
    : startOfDay(new Date(card.createdAt));

  const now = new Date();
  const cycles: BillingCycle[] = [];

  let y = startFrom.getFullYear();
  let m = startFrom.getMonth();

  // Use rangeEnd if provided, else follow backend logic of generating one month ahead
  const endDate = rangeEnd || addMonths(now, 1);

  // Generate cycles up to endDate
  while (new Date(y, m, 1) <= endDate) {
    const billDay = Math.min(card.billDate, getDaysInMonth(new Date(y, m)));
    const billDate = new Date(y, m, billDay);

    // Calculate due date (handling month rollover)
    let dueY = y;
    let dueM = m;

    if (card.dueDate <= card.billDate) {
      dueM++;
      if (dueM > 11) {
        dueM = 0;
        dueY++;
      }
    }

    const dueDay = Math.min(card.dueDate, getDaysInMonth(new Date(dueY, dueM)));
    const dueDate = new Date(dueY, dueM, dueDay);

    const cycleId = generateCycleId(y, m);
    // FIX: Handle case when payments is undefined
    const payment = card.payments?.find(p => p.cycle === cycleId);

    cycles.push({
      id: cycleId,
      cycle: cycleId,
      billDate,
      dueDate,
      isPaid: !!payment,
      paidAmount: payment?.amount,
      paidDate: payment?.date ? new Date(payment.date) : undefined,
      status: getCycleStatus(!!payment, dueDate, now),
      daysUntilDue: !payment ? differenceInDays(dueDate, now) : undefined,
      isOverdue: !payment && isBefore(dueDate, now),
      isUpcoming: !payment && isAfter(dueDate, now) && isBefore(billDate, now),
      month: format(billDate, 'MMMM yyyy'),
      shortMonth: format(billDate, 'MMM yyyy'),
    });

    m++;
    if (m > 11) { m = 0; y++; }
  }

  return cycles;
}

/**
 * Gets the status of a billing cycle
 */
function getCycleStatus(isPaid: boolean, dueDate: Date, today: Date): 'paid' | 'overdue' | 'upcoming' {
  if (isPaid) return 'paid';
  if (isBefore(dueDate, today)) return 'overdue';
  return 'upcoming';
}

/**
 * Gets the count of missed (overdue) payments
 */
// In cardDateUtils.ts
export function getMissedCardCount(card: CreditCard): number {
  const today = startOfDay(new Date());
  const cycles = getBillingCycles(card);
  return cycles.filter(c => !c.isPaid && isBefore(c.dueDate, today)).length;
}

/**
 * Gets the next unpaid cycle (either upcoming or the oldest overdue)
 */
export function getNextUnpaidCycle(card: CreditCard): BillingCycle | null {
  const today = startOfDay(new Date());
  const cycles = getBillingCycles(card);

  // Consider only cycles where bill date has arrived (matches backend logic)
  const activeUnpaid = cycles.filter(c => !c.isPaid && !isAfter(c.billDate, today));

  // First try to find upcoming unpaid cycle
  const upcoming = activeUnpaid.find(c => isAfter(c.dueDate, today));
  if (upcoming) return upcoming;

  // Then find the oldest overdue
  const overdue = activeUnpaid
    .filter(c => isBefore(c.dueDate, today))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return overdue[0] || null;
}

/**
 * Gets all unpaid cycles (both overdue and upcoming)
 */
export function getUnpaidCycles(card: CreditCard): BillingCycle[] {
  return getBillingCycles(card)
    .filter(c => !c.isPaid)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * Gets overdue cycles only
 */
export function getOverdueCycles(card: CreditCard): BillingCycle[] {
  const today = startOfDay(new Date());
  return getBillingCycles(card)
    .filter(c => !c.isPaid && isBefore(c.dueDate, today))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * Gets upcoming cycles only (bill date passed, due date in future)
 */
export function getUpcomingCycles(card: CreditCard): BillingCycle[] {
  const today = startOfDay(new Date());
  return getBillingCycles(card)
    .filter(c => !c.isPaid && isAfter(c.dueDate, today) && !isAfter(c.billDate, today))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * Formats a cycle ID for display
 */
export function formatCycleId(cycleId: string): string {
  const { year, month } = parseCycleId(cycleId);
  return format(new Date(year, month), 'MMMM yyyy');
}

/**
 * Checks if a cycle is paid
 */
export function isCyclePaid(card: CreditCard, cycleId: string): boolean {
  return card.payments.some(p => p.cycle === cycleId);
}

/**
 * Gets payment for a specific cycle
 */
export function getCyclePayment(card: CreditCard, cycleId: string) {
  return card.payments.find(p => p.cycle === cycleId);
}