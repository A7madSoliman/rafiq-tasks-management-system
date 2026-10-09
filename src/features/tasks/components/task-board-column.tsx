import AddTaskIcon from '@/assets/icons/tasks/add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';

import { cn } from '@/lib/cn';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';

type TaskBoardColumnProps = {
  status: (typeof TASK_STATUSES)[number];
  count: number;
};

const STATUS_STYLES: Record<
  TaskStatus,
  {
    dot: string;
    count: string;
  }
> = {
  TO_DO: {
    dot: 'bg-task-status-todo',
    count: 'bg-surface-nested text-foreground',
  },
  IN_PROGRESS: {
    dot: 'bg-primary-container',
    count: 'bg-primary-container/10 text-primary',
  },
  BLOCKED: {
    dot: 'bg-error',
    count: 'bg-error-container text-on-error-container',
  },
  IN_REVIEW: {
    dot: 'bg-foreground-muted',
    count: 'bg-surface-nested text-foreground',
  },
  READY_FOR_QA: {
    dot: 'bg-task-status-qa',
    count: 'bg-surface-nested text-foreground',
  },
  REOPENED: {
    dot: 'bg-error',
    count: 'bg-error-container text-on-error-container',
  },
  READY_FOR_PRODUCTION: {
    dot: 'bg-task-status-production',
    count: 'bg-surface-nested text-foreground',
  },
  DONE: {
    dot: 'bg-task-status-done',
    count: 'bg-success text-on-success',
  },
};

export function TaskBoardColumn({ status, count }: TaskBoardColumnProps) {
  const styles = STATUS_STYLES[status.value];

  return (
    <section
      aria-label={`${status.label} tasks`}
      className="flex h-full w-72 shrink-0 flex-col gap-4"
    >
      <header className="flex h-[19px] shrink-0 items-center px-1">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', styles.dot)} />

          <h2 className="text-task-status-label text-[11px] leading-[17px] font-bold tracking-[1.1px] whitespace-nowrap">
            {status.boardLabel}
          </h2>

          <span
            aria-label={`${count} tasks`}
            className={cn(
              'rounded-xs px-1.5 py-0.5 text-[10px] leading-[15px] font-bold',
              styles.count,
            )}
          >
            {count}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <button
          type="button"
          className="border-outline/30 text-foreground-secondary/60 flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-md border-2 border-dashed text-xs leading-4 font-bold tracking-[1.2px] uppercase"
        >
          <AddTaskIcon aria-hidden="true" />
          <span>Add New Task</span>
        </button>

        <div className="bg-surface-low/30 border-outline/30 flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
          <NoTasksIcon aria-hidden="true" />

          <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
            No Tasks
          </p>
        </div>
      </div>
    </section>
  );
}
