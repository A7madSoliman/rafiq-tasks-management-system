'use client';

import AddIcon from '@/assets/icons/epics/add.svg';
import DeadlineIcon from '@/assets/icons/epics/deadline.svg';
import AddTaskIcon from '@/assets/icons/epics/details/add-task.svg';
import TasksEmptyIcon from '@/assets/icons/epics/details/tasks-empty.svg';
import UnassignedIcon from '@/assets/icons/epics/details/unassigned.svg';
import { Button } from '@/components/ui/button';
import { getUserInitials } from '@/features/auth/utils/get-user-initials';
import { useEpicTasks } from '../hooks/use-epic-tasks';
import { formatEpicDeadline } from '../utils/format-epic-deadline';

type EpicTasksProps = {
  refreshRevision?: number;
  projectId: string;
  epicId: string;
  onAddTask: () => void;
  onTaskClick: (taskId: string) => void;
};

export function EpicTasks({
  projectId,
  epicId,
  onAddTask,
  onTaskClick,
  refreshRevision,
}: EpicTasksProps) {
  const { tasks, status, retry } = useEpicTasks(projectId, epicId, refreshRevision);

  return (
    <section
      aria-labelledby="epic-tasks-heading"
      className="flex min-h-[150px] flex-1 flex-col gap-4 overflow-y-auto overscroll-contain md:min-h-0 md:flex-none md:gap-6 md:overflow-visible"
    >
      <div className="bg-surface sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 md:static">
        <h3
          id="epic-tasks-heading"
          className="text-foreground text-sm leading-5 font-semibold uppercase md:text-lg md:leading-7 md:normal-case"
        >
          Tasks
        </h3>
        <button
          type="button"
          onClick={onAddTask}
          className="text-primary flex min-h-9 shrink-0 items-center gap-1 px-3 py-1.5 text-sm leading-5 font-semibold"
        >
          <AddTaskIcon aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </div>

      {status === 'loading' ? (
        <div
          role="status"
          aria-label="Loading epic tasks"
          className="flex shrink-0 flex-col gap-3 motion-safe:animate-pulse md:gap-0"
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="border-surface-icon rounded-md border p-4 md:rounded-none"
            >
              <div className="bg-surface-low h-5 w-2/3 rounded-xs" />
              <div className="bg-surface-low mt-3 h-4 w-1/3 rounded-xs" />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-foreground-secondary text-sm">Failed to load tasks.</p>
          <Button type="button" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface-low/50 border-outline/30 md:bg-surface-low flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center rounded-md border-2 border-dashed px-3 py-3 text-center md:min-h-0 md:flex-none md:px-12 md:py-[50px]">
          <div
            aria-hidden="true"
            className="bg-surface-nested mb-2 flex size-10 items-center justify-center rounded-[12px] md:mb-4 md:size-12"
          >
            <TasksEmptyIcon />
          </div>
          <p className="text-foreground max-w-[190px] text-[11px] leading-4 font-medium md:max-w-none md:text-base md:leading-6">
            No tasks have been added to this epic yet
          </p>
          <Button
            type="button"
            onClick={onAddTask}
            className="mt-2 gap-2 py-2 text-xs md:mt-4 md:py-[10px] md:text-sm"
          >
            <AddIcon aria-hidden="true" />
            Add Task
          </Button>
        </div>
      ) : (
        <ul
          aria-label="Epic tasks"
          className="md:border-outline/15 flex shrink-0 flex-col gap-3 md:gap-0 md:overflow-hidden md:rounded-md md:border"
        >
          {tasks.map((task) => {
            const name = task.assigneeName?.trim() || 'Unassigned';
            return (
              <li
                key={task.id}
                className="bg-surface border-surface-icon md:border-outline/15 relative grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 rounded-md border p-4 shadow-sm md:gap-y-1 md:rounded-none md:border-0 md:border-t md:shadow-none md:first:border-t-0"
              >
                <p className="text-foreground col-span-2 min-w-0 text-sm leading-5 font-semibold wrap-anywhere md:col-span-1 md:text-base md:leading-6 md:font-medium">
                  {task.title.trim() || 'Untitled task'}
                </p>
                <div className="flex min-w-0 items-center gap-2 md:col-start-1 md:row-start-2 md:gap-1.5">
                  <span
                    aria-hidden="true"
                    className="bg-surface-highest text-foreground-muted flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] leading-3 font-bold"
                  >
                    {task.assigneeName?.trim() ? (
                      getUserInitials(task.assigneeName)
                    ) : (
                      <UnassignedIcon />
                    )}
                  </span>
                  <span className="text-foreground-secondary md:text-foreground/60 min-w-0 text-[11px] leading-4 font-medium wrap-anywhere md:text-xs md:font-normal">
                    {name}
                  </span>
                </div>
                <div className="text-foreground-secondary/70 flex shrink-0 items-center justify-end gap-1.5 md:col-start-2 md:row-span-2 md:row-start-1 md:flex-col md:items-end md:justify-center md:gap-0">
                  <span className="md:hidden">
                    <DeadlineIcon aria-hidden="true" />
                  </span>
                  <span className="text-foreground/40 hidden text-[10px] leading-[15px] font-bold uppercase md:block">
                    Due Date
                  </span>
                  <span className="md:text-foreground/70 text-[11px] leading-4 font-bold whitespace-nowrap md:text-xs md:font-medium">
                    {formatEpicDeadline(task.dueDate)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onTaskClick(task.id)}
                  aria-label={`View details for ${task.title.trim() || 'Untitled task'}`}
                  className="focus-visible:outline-primary absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
