import TotalTasksIcon from '@/assets/icons/statistics/total-tasks.svg';
import CompletedTasksIcon from '@/assets/icons/statistics/completed-tasks.svg';
import OverdueTasksIcon from '@/assets/icons/statistics/overdue-tasks.svg';
import MobileTotalTasksIcon from '@/assets/icons/statistics/mobile-total-tasks.svg';
import MobileCompletedTasksIcon from '@/assets/icons/statistics/mobile-completed-tasks.svg';
import MobileOverdueTasksIcon from '@/assets/icons/statistics/mobile-overdue-tasks.svg';
import type { CalendarStatistics } from '../schemas/statistics-schema';

export function StatisticsSummary({ data }: { data: CalendarStatistics }) {
  const cards = [
    {
      label: 'Total Tasks',
      value: data.total_tasks,
      desktop: TotalTasksIcon,
      mobile: MobileTotalTasksIcon,
      tone: 'bg-primary-container/10',
    },
    {
      label: 'Completed Tasks',
      value: data.done_tasks,
      desktop: CompletedTasksIcon,
      mobile: MobileCompletedTasksIcon,
      tone: 'bg-task-status-production/10',
    },
    {
      label: 'Overdue Tasks',
      value: data.overdue_tasks,
      desktop: OverdueTasksIcon,
      mobile: MobileOverdueTasksIcon,
      tone: 'bg-error-container/20',
    },
  ] as const;
  return (
    <section aria-label="Task summary" className="min-w-0">
      <h2 className="text-foreground-muted mb-3 text-[10px] font-bold tracking-[1px] uppercase lg:sr-only">
        Quick Overview
      </h2>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
        {cards.map(({ label, value, desktop: DesktopIcon, mobile: MobileIcon, tone }) => (
          <article
            key={label}
            aria-label={`${label}: ${value}`}
            className="bg-surface flex min-h-[104px] min-w-[98px] flex-1 flex-col justify-between rounded-md p-3 lg:flex-row lg:items-center lg:p-6"
          >
            <div className="order-2 lg:order-1">
              <h3 className="text-foreground-muted text-[9px] leading-4 font-bold tracking-[0.6px] uppercase lg:text-xs">
                {label}
              </h3>
              <p
                className={`text-[22px] leading-7 font-bold lg:text-[30px] lg:leading-9 ${label === 'Overdue Tasks' ? 'text-error' : 'text-foreground'}`}
              >
                {value}
              </p>
            </div>
            <div
              className={`order-1 flex size-6 items-center justify-center rounded-xs lg:order-2 lg:size-12 ${tone}`}
            >
              <span className="hidden lg:block">
                <DesktopIcon aria-hidden="true" />
              </span>
              <span className="lg:hidden">
                <MobileIcon aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </div>
      <p className="text-foreground-muted mt-2 text-[11px]">
        Overdue includes all past-due tasks, regardless of selected dates.
      </p>
    </section>
  );
}
