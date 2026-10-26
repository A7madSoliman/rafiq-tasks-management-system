import DeadlineIcon from '@/assets/icons/epics/deadline.svg';
import CompletedIcon from '@/assets/icons/validation-passed.svg';
import { cn } from '@/lib/cn';
import type { CreatedTask } from '../schemas/created-task-schema';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import type { Ref } from 'react';

type TaskBoardCardProps = {
  activationRef?: Ref<HTMLButtonElement>;
  dragRef?: Ref<HTMLElement>;
  dragging?: boolean;
  task: CreatedTask;
  assigneeName?: string | null;
  mobile?: boolean;
  onTaskClick: (taskId: string) => void;
};

const MOBILE_STATUS_BADGES: Record<TaskStatus, string> = {
  TO_DO: 'bg-surface-nested text-foreground',
  IN_PROGRESS: 'bg-surface-highest text-primary',
  BLOCKED: 'bg-error-container text-on-error-container',
  IN_REVIEW: 'bg-surface-nested text-foreground',
  READY_FOR_QA: 'bg-task-status-qa text-on-primary',
  REOPENED: 'bg-error text-on-primary',
  READY_FOR_PRODUCTION: 'bg-task-status-production text-on-primary',
  DONE: 'bg-success text-on-success',
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

export function TaskBoardCard({
  activationRef,
  dragRef,
  dragging = false,
  task,
  assigneeName,
  mobile = false,
  onTaskClick,
}: TaskBoardCardProps) {
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

  if (mobile) {
    const statusLabel = TASK_STATUSES.find((status) => status.value === task.status)?.boardLabel;

    return (
      <article
        ref={dragRef}
        className={cn(
          'relative flex min-h-[122px] min-w-0 flex-col gap-3 rounded-md border p-4',
          'shadow-[0_2px_4px_rgba(0,0,0,0.02)]',
          isBlocked ? 'border-error/10 bg-error-container/20' : 'border-outline/10 bg-surface',
          dragging && 'opacity-40',
        )}
      >
        <div className="flex min-h-5 items-center justify-between gap-2">
          {task.task_id ? (
            <span className="text-task-status-label min-w-0 truncate text-[10px] leading-4 font-medium uppercase">
              {task.task_id}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}

          <span
            className={cn(
              'ml-auto inline-flex max-w-[65%] shrink-0 items-center rounded-xs px-2 py-1',
              'text-[10px] leading-3 font-bold tracking-[0.3px] uppercase',
              MOBILE_STATUS_BADGES[task.status],
            )}
          >
            {statusLabel ?? task.status}
          </span>
        </div>

        <h3
          className={cn(
            'text-foreground line-clamp-2 text-sm leading-5 font-medium break-words',
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
                <time dateTime={task.due_date} className="text-[10px] leading-[15px] font-bold">
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
                  'ml-auto flex size-6 shrink-0 items-center justify-center rounded-xl',
                  'border text-[10px] leading-[15px] font-bold',
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

        <button
          ref={activationRef}
          type="button"
          onClick={() => onTaskClick(task.id)}
          aria-keyshortcuts={activationRef ? 'Enter Space' : undefined}
          aria-label={`View details for ${task.task_id ? `${task.task_id}: ` : ''}${task.title}`}
          className="focus-visible:outline-primary absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </article>
    );
  }
  return (
    <article
      ref={dragRef}
      className={cn(
        'relative flex w-full flex-col rounded-md border p-4',
        'shadow-[0_2px_4px_rgba(0,0,0,0.02)]',
        isDone ? 'min-h-[113px] gap-4' : 'min-h-[113px] gap-2',
        isBlocked ? 'border-error/10 bg-error-container/20' : 'border-outline/10 bg-surface',
        dragging && 'opacity-40',
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

      <button
        ref={activationRef}
        type="button"
        onClick={() => onTaskClick(task.id)}
        aria-keyshortcuts={activationRef ? 'Enter Space' : undefined}
        aria-label={`View details for ${task.task_id ? `${task.task_id}: ` : ''}${task.title}`}
        className="focus-visible:outline-primary absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </article>
  );
}
