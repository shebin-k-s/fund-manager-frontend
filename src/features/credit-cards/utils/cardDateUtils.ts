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
// In cardDateUtils.ts - Update getBillingCycles function
export function getBillingCycles(card: CreditCard): BillingCycle[] {
  const startFrom = card.billingStartDate
    ? startOfDay(new Date(card.billingStartDate))
    : startOfDay(new Date(card.createdAt));

  const now = new Date();
  const cycles: BillingCycle[] = [];

  let currentDate = startFrom;

  // Only generate cycles up to current month
  const endDate = now;

  // Generate cycles until we reach current month
  while (isBefore(currentDate, endDate) || isSameMonth(currentDate, endDate)) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Validate and adjust bill/due dates based on month length
    const billDay = validateDate(card.billDate, year, month);
    const billDate = new Date(year, month, billDay);

    // Calculate due date (handling month rollover)
    let dueYear = year;
    let dueMonth = month;

    if (card.dueDate <= card.billDate) {
      dueMonth++;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear++;
      }
    }

    const dueDay = validateDate(card.dueDate, dueYear, dueMonth);
    const dueDate = new Date(dueYear, dueMonth, dueDay);

    const cycleId = generateCycleId(year, month);
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

    currentDate = addMonths(currentDate, 1);
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

  // First try to find upcoming unpaid cycle
  const upcoming = cycles.find(c => !c.isPaid && isAfter(c.dueDate, today));
  if (upcoming) return upcoming;

  // Then find the oldest overdue
  const overdue = cycles
    .filter(c => !c.isPaid && isBefore(c.dueDate, today))
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
    .filter(c => !c.isPaid && isAfter(c.dueDate, today))
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