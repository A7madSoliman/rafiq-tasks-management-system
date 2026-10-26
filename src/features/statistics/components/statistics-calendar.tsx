import NoDayTasksIcon from '@/assets/icons/statistics/no-day-tasks.svg';
import { cn } from '@/lib/cn';
import type { CalendarStatistics } from '../schemas/statistics-schema';
import { localCalendarDate } from '../utils/statistics-dates';
import { calendarDayLabel, nonzeroStatuses } from '../utils/statistics-display';

export function StatisticsCalendar({ data }: { data: CalendarStatistics }) {
  const today = localCalendarDate(new Date());
  const days = [...data.daily].sort((a, b) => a.day.localeCompare(b.day));
  return (
    <section aria-label="Weekly calendar" className="min-w-0">
      <h2 className="text-foreground mb-3 text-sm font-bold lg:sr-only">Calendar</h2>
      <div
        className="hidden min-w-0 gap-3 lg:grid"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((entry) => {
          const statuses = nonzeroStatuses(entry.statuses);
          const label = calendarDayLabel(entry.day);
          return (
            <article
              key={entry.day}
              aria-label={`${label.weekday} ${label.date}`}
              className={cn(
                'bg-surface flex h-[420px] min-w-0 flex-col rounded-md p-4 shadow-sm',
                entry.day === today && 'ring-primary-container ring-2 ring-inset',
              )}
            >
              <div className="relative mb-4">
                {entry.day === today && (
                  <span className="bg-primary-container absolute -top-6 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                    Today
                  </span>
                )}
                <p className="text-foreground-subtle text-xs font-bold uppercase">
                  {label.weekday}
                </p>
                <p className="text-foreground text-lg leading-7 font-bold">{label.date}</p>
              </div>
              {statuses.length ? (
                <ul className="flex flex-col gap-2">
                  {statuses.map((status) => (
                    <li
                      key={status.value}
                      className={cn(
                        'flex min-w-0 items-center justify-between gap-1 rounded-xs p-2 text-[10px] font-bold',
                        status.background,
                      )}
                    >
                      <span className={cn('min-w-0 break-words uppercase', status.foreground)}>
                        {status.label}
                      </span>
                      <span className="text-foreground">{status.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-foreground-subtle flex flex-1 flex-col items-center justify-center gap-2 opacity-50">
                  <NoDayTasksIcon aria-hidden="true" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">No tasks</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="flex min-w-0 flex-col gap-1 lg:hidden">
        {days.map((entry) => {
          const statuses = nonzeroStatuses(entry.statuses);
          const label = calendarDayLabel(entry.day);
          const total = statuses.reduce((sum, status) => sum + status.count, 0);
          return (
            <article
              key={entry.day}
              aria-label={`${label.weekday} ${label.date}: ${total} tasks`}
              className={cn(
                'bg-surface-low flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 py-2',
                entry.day === today && 'bg-surface ring-primary-container ring-2 ring-inset',
              )}
            >
              <div className="w-8 shrink-0">
                <p className="text-foreground-muted text-[9px] font-bold uppercase">
                  {label.weekday}
                </p>
                <p className="text-foreground text-sm font-bold">{label.dayNumber}</p>
              </div>
              <span className="bg-surface-nested text-foreground shrink-0 rounded-xs px-1.5 text-[10px] font-bold">
                {total}
              </span>
              <ul aria-label="Status counts" className="flex min-w-0 flex-1 flex-wrap gap-1">
                {statuses.map((status) => (
                  <li
                    key={status.value}
                    title={`${status.label}: ${status.count}`}
                    className={cn(
                      'rounded-xs px-1.5 py-0.5 text-[10px] font-bold',
                      status.background,
                      status.foreground,
                    )}
                  >
                    <span className="sr-only">{status.label}: </span>
                    {status.count}
                  </li>
                ))}
              </ul>
              {entry.day === today && (
                <span className="bg-primary-container shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                  Today
                </span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
