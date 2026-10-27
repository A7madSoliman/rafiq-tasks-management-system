import {
  calendarStatisticsRequestSchema,
  type CalendarStatisticsRequest,
} from '../schemas/statistics-schema';
import { currentStatisticsWeek } from './statistics-dates';

export type StatisticsFilters = CalendarStatisticsRequest;

export function initialStatisticsFilters(now = new Date()): StatisticsFilters {
  return { ...currentStatisticsWeek(now), p_project_id: null, p_status: null };
}

export function updateStatisticsFilters(
  current: StatisticsFilters,
  changes: unknown,
): StatisticsFilters {
  const result = calendarStatisticsRequestSchema.safeParse(changes);
  return result.success ? result.data : current;
}
