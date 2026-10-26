import { TASK_STATUSES, type TaskStatus } from '@/features/tasks/constants/task-statuses';
import type { CalendarStatistics } from '../schemas/statistics-schema';
import { calendarDate } from './statistics-dates';

export const STATUS_COLORS: Record<
  TaskStatus,
  { background: string; foreground: string; chart: string }
> = {
  TO_DO: {
    background: 'bg-surface-nested/50',
    foreground: 'text-task-status-label',
    chart: 'var(--color-task-status-todo)',
  },
  IN_PROGRESS: {
    background: 'bg-primary-container/10',
    foreground: 'text-primary',
    chart: 'var(--color-primary-container)',
  },
  BLOCKED: {
    background: 'bg-error-container/30',
    foreground: 'text-error',
    chart: 'var(--color-error)',
  },
  IN_REVIEW: {
    background: 'bg-surface-nested/50',
    foreground: 'text-foreground-muted',
    chart: 'var(--color-foreground-muted)',
  },
  READY_FOR_QA: {
    background: 'bg-task-status-qa/10',
    foreground: 'text-task-status-qa',
    chart: 'var(--color-task-status-qa)',
  },
  REOPENED: {
    background: 'bg-error-container/30',
    foreground: 'text-error',
    chart: 'var(--color-on-error-container)',
  },
  READY_FOR_PRODUCTION: {
    background: 'bg-task-status-production/10',
    foreground: 'text-task-status-production',
    chart: 'var(--color-task-status-production)',
  },
  DONE: {
    background: 'bg-task-status-done/15',
    foreground: 'text-task-status-production',
    chart: 'var(--color-task-status-production)',
  },
};

export function nonzeroStatuses(counts: CalendarStatistics['totals']) {
  return TASK_STATUSES.flatMap((status) => {
    const count = counts[status.value] ?? 0;
    return count > 0 ? [{ ...status, count, ...STATUS_COLORS[status.value] }] : [];
  });
}

export function calendarDayLabel(day: string) {
  const date = calendarDate(day);
  return {
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date),
    date: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(date),
    dayNumber: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(date),
  };
}
