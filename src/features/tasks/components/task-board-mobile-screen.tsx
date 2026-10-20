import MobileSearchIcon from '@/assets/icons/tasks/mobile-search.svg';
import MobileAddTaskIcon from '@/assets/icons/tasks/mobile-add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';
import { Button } from '@/components/ui/button';
import type { CreatedTask } from '../schemas/created-task-schema';
import { TaskBoardCard } from './task-board-card';
import type { TaskStatus } from '../constants/task-statuses';

type TaskBoardMobileScreenProps = {
  tasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: () => void;
  isLoading: boolean;
  failedStatuses: readonly {
    value: TaskStatus;
    label: string;
  }[];
  onRetryStatus: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
};

export function TaskBoardMobileScreen({
  tasks,
  assigneeNamesById,
  onAddTask,
  isLoading,
  failedStatuses,
  onRetryStatus,
  onTaskClick,
}: TaskBoardMobileScreenProps) {
  const isEmpty = tasks.length === 0;

  return (
    <section
      aria-label="Mobile tasks board"
      className="flex min-h-[calc(100dvh-128px)] min-w-0 flex-col px-4 pt-[38px] pb-[65px] lg:hidden"
    >
      <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px]">
        Active Workboard
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        <label className="bg-surface-highest flex h-[47px] w-full items-center gap-[10px] rounded-md px-3">
          <MobileSearchIcon aria-hidden="true" />

          <input
            type="search"
            readOnly
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="text-foreground placeholder:text-foreground-secondary/50 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>

        <Button
          type="button"
          onClick={onAddTask}
          className="h-8 w-full cursor-pointer gap-2 rounded-sm px-4 py-0 text-xs font-bold tracking-[1.2px] uppercase"
        >
          <MobileAddTaskIcon aria-hidden="true" />
          <span>Add New Task</span>
        </Button>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-label="Loading tasks"
          className="bg-surface mt-7 animate-pulse rounded-md p-4"
        >
          <div className="bg-surface-icon h-3 w-3/4 rounded-xs" />
          <div className="bg-surface-icon mt-3 h-3 w-1/2 rounded-xs" />
        </div>
      )}

      {failedStatuses.length > 0 && (
        <div role="alert" className="bg-surface mt-5 flex flex-wrap gap-3 rounded-md p-4">
          <p className="text-error w-full text-xs">Failed to load some task statuses.</p>

          {failedStatuses.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onRetryStatus(value)}
              className="text-primary text-xs font-semibold underline"
            >
              Retry {label}
            </button>
          ))}
        </div>
      )}

      {isEmpty && !isLoading && failedStatuses.length === 0 && (
        <div className="bg-surface-low/30 border-outline/30 mt-7 flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
          <NoTasksIcon aria-hidden="true" />

          <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
            No Tasks
          </p>
        </div>
      )}
      {!isEmpty && (
        <div aria-label="Tasks" className="mt-7 flex min-w-0 flex-col gap-3">
          {tasks.map((task) => (
            <TaskBoardCard
              key={task.id}
              task={task}
              mobile
              onTaskClick={onTaskClick}
              assigneeName={
                task.assignee_id ? (assigneeNamesById.get(task.assignee_id) ?? null) : null
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
