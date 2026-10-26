import type { CalendarStatistics, ProjectStatistics } from '../schemas/statistics-schema';
import { nonzeroStatuses } from '../utils/statistics-display';

export function TasksByStatus({ data }: { data: CalendarStatistics }) {
  const statuses = nonzeroStatuses(data.totals);
  const statusTotal = statuses.reduce((sum, status) => sum + status.count, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = statuses.reduce<
    Array<(typeof statuses)[number] & { length: number; offset: number }>
  >((result, status) => {
    const length = statusTotal ? (status.count / statusTotal) * circumference : 0;
    const previous = result.at(-1);
    const offset = previous ? previous.offset - previous.length : 0;
    return [...result, { ...status, length, offset }];
  }, []);
  return (
    <section
      aria-labelledby="status-chart-title"
      className="bg-surface min-w-0 rounded-md p-4 lg:min-h-[210px] lg:p-6"
    >
      <h3 id="status-chart-title" className="text-foreground text-sm font-bold">
        Tasks by Status
      </h3>
      <div className="mt-5 flex min-w-0 items-center gap-4 lg:mt-8 lg:gap-6">
        <div className="relative size-[126px] shrink-0 lg:size-36">
          <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--color-surface-icon)"
              strokeWidth="14"
            />
            {segments.map((segment) => (
              <circle
                key={segment.value}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={segment.chart}
                strokeWidth="14"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={segment.offset}
                transform="rotate(-90 50 50)"
              />
            ))}
          </svg>
          <div className="text-foreground pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl leading-7 font-bold">{data.total_tasks}</span>
            <span className="text-foreground-muted text-[10px]">Total</span>
          </div>
        </div>
        {statuses.length ? (
          <ul aria-label="Tasks by status counts" className="flex min-w-0 flex-1 flex-col gap-2">
            {statuses.map((status) => (
              <li key={status.value} className="min-w-0 text-[10px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: status.chart }}
                    aria-hidden="true"
                  />
                  <span className="text-foreground-muted min-w-0 flex-1 break-words">
                    {status.label}
                  </span>
                  <span className="text-foreground font-bold">{status.count}</span>
                </div>
                <div className="bg-surface-icon mt-1 ml-4 h-0.5">
                  <div
                    className="h-full"
                    style={{
                      width: `${(status.count / statusTotal) * 100}%`,
                      backgroundColor: status.chart,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground-muted text-xs">No tasks in this range.</p>
        )}
      </div>
    </section>
  );
}

export function AllProjectsStatistics({ projects }: { projects: ProjectStatistics[] }) {
  return (
    <section
      aria-labelledby="all-projects-title"
      className="bg-surface min-w-0 rounded-md p-4 lg:min-h-[210px] lg:p-6"
    >
      <h3 id="all-projects-title" className="text-foreground text-sm font-bold">
        All Projects
      </h3>
      <p className="text-foreground-muted mt-1 text-[10px]">Counts use the selected dates only.</p>
      {projects.length ? (
        <ul className="mt-6 flex min-w-0 flex-col gap-4 lg:mt-8">
          {projects.map((project) => (
            <li
              key={project.project_id}
              className="text-foreground flex min-w-0 items-start justify-between gap-3 text-[10px] font-semibold"
            >
              <span className="min-w-0 break-words">{project.project_name}</span>
              <span className="shrink-0">
                {project.tasks_count} {project.tasks_count === 1 ? 'Task' : 'Tasks'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground-muted mt-6 text-sm">No project tasks in this date range.</p>
      )}
    </section>
  );
}
