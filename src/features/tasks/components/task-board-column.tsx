'use client';

import { useEffect, useRef } from 'react';

import AddTaskIcon from '@/assets/icons/tasks/add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';

import { cn } from '@/lib/cn';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';

import { BoardTaskCard, BoardStatusTarget } from './task-board-drag-drop';

type TaskBoardColumnProps = {
  canMove?: boolean;
  status: (typeof TASK_STATUSES)[number];
  tasks: readonly CreatedTask[];
  totalCount: number;

  onAddTask: () => void;
  onTaskClick: (taskId: string) => void;
  assigneeNamesById: ReadonlyMap<string, string>;

  showAddButton?: boolean;

  loadState: 'loading' | 'success' | 'error';
  onRetry: () => void;

  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  onRetryLoadMore: () => void;
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
  canMove = false,
  status,
  tasks,
  totalCount,
  onAddTask,
  onTaskClick,
  assigneeNamesById,
  loadState,
  onRetry,
  showAddButton = true,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onRetryLoadMore,
}: TaskBoardColumnProps) {
  const styles = STATUS_STYLES[status.value];

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Observe the end of this specific column's scroll container.
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;

    if (
      !scrollContainer ||
      !sentinel ||
      loadState !== 'success' ||
      !hasMore ||
      isLoadingMore ||
      loadMoreError
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '0px 0px 80px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadState, hasMore, isLoadingMore, loadMoreError, onLoadMore, tasks.length]);

  const displayedCount =
    loadState === 'success'
      ? Math.max(totalCount, tasks.length)
      : tasks.length > 0
        ? tasks.length
        : null;

  return (
    <BoardStatusTarget status={status.value} available={canMove && loadState === 'success'}>
      {({ ref, highlighted }) => (
        <section
          ref={ref}
          aria-label={`${status.label} tasks`}
          className={cn(
            'relative isolate flex w-full min-w-0 flex-col gap-4 rounded-md lg:h-full lg:w-72 lg:shrink-0',
            // Paint inside the scroll boundary and above the cards' z-10 buttons.
            highlighted &&
              'bg-surface-nested after:ring-primary after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[inherit] after:ring-2 after:ring-inset',
          )}
        >
          <header className="flex h-[19px] shrink-0 items-center px-1">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', styles.dot)} />

              <h2 className="text-task-status-label text-[11px] leading-[17px] font-bold tracking-[1.1px] whitespace-nowrap">
                {status.boardLabel}
              </h2>

              <span
                aria-label={
                  displayedCount !== null
                    ? `${displayedCount} tasks`
                    : `${status.label} tasks ${loadState}`
                }
                className={cn(
                  'rounded-xs px-1.5 py-0.5 text-[10px] leading-[15px] font-bold',
                  styles.count,
                )}
              >
                {displayedCount ?? '—'}
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

            {/* Initial loading state */}
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

            {/* Initial loading error */}
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

            {/* Empty status column */}
            {loadState === 'success' && tasks.length === 0 && (
              <div className="bg-surface-low/30 border-outline/30 flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
                <NoTasksIcon aria-hidden="true" />

                <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
                  No Tasks
                </p>
              </div>
            )}

            {/* Scrollable task list */}
            {tasks.length > 0 && (
              <div
                ref={scrollContainerRef}
                aria-label={`${status.label} task list`}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2"
              >
                {tasks.map((task) => (
                  <BoardTaskCard
                    canMove={canMove && loadState === 'success'}
                    key={task.id}
                    task={task}
                    onTaskClick={onTaskClick}
                    assigneeName={
                      task.assignee_id ? (assigneeNamesById.get(task.assignee_id) ?? null) : null
                    }
                  />
                ))}

                {/* Observer target for the next page */}
                {hasMore && (
                  <div ref={loadMoreSentinelRef} aria-hidden="true" className="h-1 shrink-0" />
                )}

                {/* Loading an additional page */}
                {isLoadingMore && (
                  <div
                    role="status"
                    aria-label={`Loading more ${status.label} tasks`}
                    className="text-foreground-secondary py-3 text-center text-xs"
                  >
                    Loading more tasks...
                  </div>
                )}

                {/* Error while loading an additional page */}
                {loadMoreError && (
                  <div className="flex flex-col items-center gap-2 py-3 text-center">
                    <p role="alert" className="text-error text-xs">
                      Failed to load more tasks.
                    </p>

                    <button
                      type="button"
                      onClick={onRetryLoadMore}
                      className="text-primary text-xs font-semibold underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </BoardStatusTarget>
  );
}
