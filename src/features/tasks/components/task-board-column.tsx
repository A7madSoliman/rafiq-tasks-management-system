import AddTaskIcon from '@/assets/icons/tasks/add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';

import { cn } from '@/lib/cn';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';

import { TaskBoardCard } from './task-board-card';

type TaskBoardColumnProps = {
  status: (typeof TASK_STATUSES)[number];
  tasks: readonly CreatedTask[];
  onAddTask: () => void;
  assigneeNamesById: ReadonlyMap<string, string>;
  showAddButton?: boolean;
  loadState: 'loading' | 'success' | 'error';
  onRetry: () => void;
  onTaskClick: (taskId: string) => void;
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

export function TaskBoardColumn({
  status,
  tasks,
  onAddTask,
  assigneeNamesById,
  loadState,
  onRetry,
  showAddButton = true,
  onTaskClick,
}: TaskBoardColumnProps) {
  const styles = STATUS_STYLES[status.value];

  return (
    <section
      aria-label={`${status.label} tasks`}
      className="flex w-full min-w-0 flex-col gap-4 lg:h-full lg:w-72 lg:shrink-0"
    >
      <header className="flex h-[19px] shrink-0 items-center px-1">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', styles.dot)} />

          <h2 className="text-task-status-label text-[11px] leading-[17px] font-bold tracking-[1.1px] whitespace-nowrap">
            {status.boardLabel}
          </h2>

          <span
            aria-label={
              loadState === 'success' || tasks.length > 0
                ? `${tasks.length} tasks`
                : `${status.label} tasks ${loadState}`
            }
            className={cn(
              'rounded-xs px-1.5 py-0.5 text-[10px] leading-[15px] font-bold',
              styles.count,
            )}
          >
            {loadState === 'success' || tasks.length > 0 ? tasks.length : '—'}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {showAddButton && (
          <button
            type="button"
            onClick={onAddTask}
            className="border-outline/30 text-foreground-secondary/60 flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-md border-2 border-dashed text-xs leading-4 font-bold tracking-[1.2px] uppercase"
          >
            <AddTaskIcon aria-hidden="true" />
            <span>Add New Task</span>
          </button>
        )}

        {loadState === 'loading' && (
          <div
            role="status"
            aria-label={`Loading ${status.label} tasks`}
            className="bg-surface border-outline/10 h-28 animate-pulse rounded-md border p-4"
          >
            <div className="bg-surface-icon h-3 w-3/4 rounded-xs" />
            <div className="bg-surface-icon mt-3 h-3 w-1/2 rounded-xs" />
          </div>
        )}
        {loadState === 'error' && (
          <div className="bg-surface-low/30 border-outline/30 flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center">
            <p role="alert" className="text-error text-xs">
              Failed to load tasks
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="text-primary text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
        {loadState === 'success' && tasks.length === 0 && (
          <div className="bg-surface-low/30 border-outline/30 flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
            <NoTasksIcon aria-hidden="true" />

            <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
              No Tasks
            </p>
          </div>
        )}
        {tasks.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
            {tasks.map((task) => (
              <TaskBoardCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                assigneeName={
                  task.assignee_id ? (assigneeNamesById.get(task.assignee_id) ?? null) : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
