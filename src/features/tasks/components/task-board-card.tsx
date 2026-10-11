import DeadlineIcon from '@/assets/icons/epics/deadline.svg';
import CompletedIcon from '@/assets/icons/validation-passed.svg';
import { cn } from '@/lib/cn';
import type { CreatedTask } from '../schemas/created-task-schema';

type TaskBoardCardProps = {
  task: CreatedTask;
  assigneeName?: string | null;
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getTodayLocalDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })
    .format(new Date(value))
    .toUpperCase();
}

export function TaskBoardCard({ task, assigneeName }: TaskBoardCardProps) {
  const isDone = task.status === 'DONE';
  const isBlocked = task.status === 'BLOCKED';

  const initials = assigneeName ? getInitials(assigneeName) : null;

  const dueDate = task.due_date?.slice(0, 10) ?? null;
  const today = getTodayLocalDate();

  const isDueToday = dueDate === today;

  const isDelayed = isBlocked && dueDate !== null && dueDate < today;

  const dateLabel = task.due_date
    ? isDelayed
      ? 'DELAYED'
      : isDueToday
        ? 'TODAY'
        : formatDueDate(task.due_date)
    : null;

  const dateColor = isDelayed
    ? 'text-error'
    : isDueToday
      ? 'text-primary'
      : 'text-task-status-todo';

  const hasFooter = isDone || Boolean(dateLabel) || Boolean(initials);

  return (
    <article
      className={cn(
        'flex w-full flex-col rounded-md border p-4',
        'shadow-[0_2px_4px_rgba(0,0,0,0.02)]',
        isDone ? 'min-h-[94px] gap-4' : 'min-h-[113px] gap-2',
        isBlocked ? 'border-error/10 bg-error-container/20' : 'border-outline/10 bg-surface',
      )}
    >
      <h3
        className={cn(
          'text-foreground line-clamp-2 break-words',
          'text-sm leading-[19.25px] font-medium',
          isDone && 'text-foreground/60 decoration-foreground/50 line-through',
        )}
      >
        {task.title}
      </h3>

      {hasFooter && (
        <div className="mt-auto flex min-h-6 items-center justify-between gap-2">
          {isDone ? (
            <div className="text-task-status-production flex items-center gap-2">
              <CompletedIcon aria-hidden="true" />

              <span className="text-[10px] leading-[15px] font-bold">COMPLETED</span>
            </div>
          ) : task.due_date && dateLabel ? (
            <div className={cn('flex items-center gap-2', dateColor)}>
              <DeadlineIcon aria-hidden="true" className="shrink-0 [&_path]:fill-current" />

              <time
                dateTime={task.due_date}
                title={formatDueDate(task.due_date)}
                className="text-[10px] leading-[15px] font-bold"
              >
                {dateLabel}
              </time>
            </div>
          ) : (
            <span aria-hidden="true" />
          )}

          {initials && (
            <span
              title={assigneeName ?? undefined}
              aria-label={`Assigned to ${assigneeName}`}
              className={cn(
                'ml-auto flex size-6 shrink-0 items-center justify-center',
                'rounded-xl border text-[10px] leading-[15px] font-bold',
                task.status === 'IN_PROGRESS'
                  ? 'border-surface bg-primary-container text-on-primary'
                  : 'border-surface bg-surface-nested text-foreground',
              )}
            >
              {initials}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
