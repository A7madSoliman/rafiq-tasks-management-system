import { afterEach, describe, expect, it, vi } from 'vitest';
import { statisticsDateRangeSchema } from '../schemas/statistics-schema';
import {
  currentStatisticsWeek,
  localCalendarDate,
  monthDays,
  shiftCalendarMonth,
  shiftStatisticsWeek,
} from './statistics-dates';
import { initialStatisticsFilters, updateStatisticsFilters } from './statistics-filters';

afterEach(() => vi.unstubAllEnvs());

describe('statistics calendar dates and filters', () => {
  it('uses the browser-local date even when UTC is the previous day', () => {
    vi.stubEnv('TZ', 'Pacific/Kiritimati');
    const now = new Date('2026-10-26T10:15:00Z');
    expect(localCalendarDate(now)).toBe('2026-10-27');
    expect(currentStatisticsWeek(now)).toEqual({
      p_start_date: '2026-10-25',
      p_end_date: '2026-10-31',
    });
  });

  it('defaults to Sunday-Saturday across a year boundary', () => {
    expect(currentStatisticsWeek(new Date(2027, 0, 1, 12))).toEqual({
      p_start_date: '2026-12-27',
      p_end_date: '2027-01-02',
    });
  });

  it('shifts a week across DST without adding elapsed hours', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const range = currentStatisticsWeek(new Date(2026, 2, 8, 0, 15));
    expect(range).toEqual({ p_start_date: '2026-03-08', p_end_date: '2026-03-14' });
    expect(shiftStatisticsWeek(range, 1)).toEqual({
      p_start_date: '2026-03-15',
      p_end_date: '2026-03-21',
    });
    expect(shiftStatisticsWeek(range, -1)).toEqual({
      p_start_date: '2026-03-01',
      p_end_date: '2026-03-07',
    });
  });

  it('preserves the length of a shorter applied range', () => {
    expect(
      shiftStatisticsWeek({ p_start_date: '2026-05-01', p_end_date: '2026-05-02' }, 1),
    ).toEqual({ p_start_date: '2026-05-08', p_end_date: '2026-05-09' });
  });

  it('builds a complete Monday-first month and clamps month navigation', () => {
    const days = monthDays('2024-02-10');
    expect(days[0]).toBe('2024-01-29');
    expect(days.at(-1)).toBe('2024-03-03');
    expect(days).toContain('2024-02-29');
    expect(shiftCalendarMonth('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('uses Phase 1 validation for inclusive ranges and prevents invalid applied state', () => {
    const filters = initialStatisticsFilters(new Date(2026, 4, 13, 12));
    expect(filters).toEqual({
      p_start_date: '2026-05-10',
      p_end_date: '2026-05-16',
      p_project_id: null,
      p_status: null,
    });
    expect(
      statisticsDateRangeSchema.safeParse({ p_start_date: '2026-05-01', p_end_date: '2026-05-07' })
        .success,
    ).toBe(true);
    expect(
      statisticsDateRangeSchema.safeParse({ p_start_date: '2026-05-01', p_end_date: '2026-05-08' })
        .success,
    ).toBe(false);
    expect(updateStatisticsFilters(filters, { ...filters, p_end_date: '2026-05-20' })).toBe(
      filters,
    );
    expect(updateStatisticsFilters(filters, { ...filters, p_project_id: 'bad' })).toBe(filters);
    expect(updateStatisticsFilters(filters, { ...filters, p_status: 'ACTIVE' })).toBe(filters);
    expect(updateStatisticsFilters(filters, { ...filters, p_status: 'DONE' }).p_status).toBe(
      'DONE',
    );
  });
});
