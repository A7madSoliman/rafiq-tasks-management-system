import { statisticsDateRangeSchema, type StatisticsDateRange } from '../schemas/statistics-schema';

export function localCalendarDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// These Dates represent date-only values, not browser-local instants.
export function calendarDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

export function shiftCalendarDate(value: string, days: number): string {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export function currentStatisticsWeek(now = new Date()): StatisticsDateRange {
  const start = shiftCalendarDate(localCalendarDate(now), -now.getDay());
  return { p_start_date: start, p_end_date: shiftCalendarDate(start, 6) };
}

export function shiftStatisticsWeek(range: StatisticsDateRange, direction: -1 | 1) {
  const result = statisticsDateRangeSchema.safeParse({
    p_start_date: shiftCalendarDate(range.p_start_date, direction * 7),
    p_end_date: shiftCalendarDate(range.p_end_date, direction * 7),
  });
  return result.success ? result.data : null;
}

export function shiftCalendarMonth(value: string, direction: -1 | 1): string {
  const date = calendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction);
  const last = new Date(date);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, last.getUTCDate()));
  return date.toISOString().split('T')[0];
}

export function monthDays(value: string): string[] {
  const first = `${value.slice(0, 7)}-01`;
  const date = calendarDate(first);
  const offset = (date.getUTCDay() + 6) % 7; // Picker is Monday-first in Figma.
  const last = new Date(date);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const count = Math.ceil((offset + last.getUTCDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => shiftCalendarDate(first, index - offset));
}

export function selectRangeDay(draft: StatisticsDateRange, day: string): StatisticsDateRange {
  return draft.p_end_date ? { p_start_date: day, p_end_date: '' } : { ...draft, p_end_date: day };
}

export function formatStatisticsRange(range: StatisticsDateRange, includeYear = true): string {
  const start = calendarDate(range.p_start_date);
  const end = calendarDate(range.p_end_date);
  const format = (date: Date, year: boolean) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      ...(year ? ({ year: 'numeric' } as const) : {}),
      timeZone: 'UTC',
    }).format(date);
  const differentYears = start.getUTCFullYear() !== end.getUTCFullYear();
  return `${format(start, differentYears)} - ${format(end, includeYear || differentYears)}`;
}
