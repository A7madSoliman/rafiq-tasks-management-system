import { z } from 'zod';

import { TASK_STATUSES } from '@/features/tasks/constants/task-statuses';

// PostgreSQL date has no year zero.
const calendarDateSchema = z.iso.date().refine((value) => !value.startsWith('0000-'));
const dateFields = {
  p_start_date: calendarDateSchema,
  p_end_date: calendarDateSchema,
};
const statusSchema = z.enum(TASK_STATUSES.map((status) => status.value));
const countSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const statusCountsSchema = z.partialRecord(statusSchema, countSchema);
const dayMilliseconds = 86_400_000;

function validRange(range: { p_start_date: string; p_end_date: string }) {
  // Calendar-date arithmetic in UTC avoids DST and browser timezone shifts.
  const difference =
    Date.parse(`${range.p_end_date}T00:00:00Z`) - Date.parse(`${range.p_start_date}T00:00:00Z`);
  return difference >= 0 && difference < 7 * dayMilliseconds;
}

const rangeError = {
  message: 'Select a date range of 1–7 calendar days.',
  path: ['p_end_date'],
};

export const statisticsDateRangeSchema = z.strictObject(dateFields).refine(validRange, rangeError);

export const calendarStatisticsRequestSchema = z
  .strictObject({
    ...dateFields,
    p_project_id: z.uuid().nullable().default(null),
    p_status: statusSchema.nullable().default(null),
  })
  .refine(validRange, rangeError);

// The deployed RPC has an optional status argument; this API intentionally omits it.
export const projectsStatisticsRequestSchema = statisticsDateRangeSchema;

export const calendarStatisticsSchema = z.strictObject({
  daily: z
    .array(z.strictObject({ day: calendarDateSchema, statuses: statusCountsSchema }))
    .min(1)
    .max(7),
  totals: statusCountsSchema,
  total_tasks: countSchema,
  done_tasks: countSchema,
  // The backend counts overdue tasks across all dates, not just the selected range.
  overdue_tasks: countSchema,
});

export const projectsStatisticsSchema = z.array(
  z.strictObject({
    project_id: z.uuid(),
    project_name: z.string(),
    tasks_count: countSchema,
  }),
);

export type StatisticsDateRange = z.infer<typeof statisticsDateRangeSchema>;
export type CalendarStatisticsRequest = z.infer<typeof calendarStatisticsRequestSchema>;
export type CalendarStatistics = z.infer<typeof calendarStatisticsSchema>;
export type ProjectStatistics = z.infer<typeof projectsStatisticsSchema>[number];

export function calendarMatchesRange(data: CalendarStatistics, range: StatisticsDateRange) {
  const expectedDays =
    (Date.parse(`${range.p_end_date}T00:00:00Z`) - Date.parse(`${range.p_start_date}T00:00:00Z`)) /
      dayMilliseconds +
    1;
  const days = data.daily.map((entry) => entry.day);
  return (
    days.length === expectedDays &&
    new Set(days).size === days.length &&
    days.every((day) => day >= range.p_start_date && day <= range.p_end_date)
  );
}
