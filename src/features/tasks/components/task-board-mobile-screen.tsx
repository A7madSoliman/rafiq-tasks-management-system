'use client';

import { useEffect, useRef } from 'react';

import MobileSearchIcon from '@/assets/icons/tasks/mobile-search.svg';
import MobileAddTaskIcon from '@/assets/icons/tasks/mobile-add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';

import { Button } from '@/components/ui/button';

import type { CreatedTask } from '../schemas/created-task-schema';
import { BoardTaskCard } from './task-board-drag-drop';

type TaskBoardMobileScreenProps = {
  canMove?: boolean;
  tasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: () => void;
  onTaskClick: (taskId: string) => void;

  searchValue: string;
  onSearchChange: (value: string) => void;

  loadState: 'loading' | 'success' | 'error';
  onRetry: () => void;

  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  onRetryLoadMore: () => void;
};

export function TaskBoardMobileScreen({
  canMove = false,
  tasks,
  assigneeNamesById,
  onAddTask,
  onTaskClick,
  searchValue,
  onSearchChange,
  loadState,
  onRetry,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onRetryLoadMore,
}: TaskBoardMobileScreenProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || loadState !== 'success' || !hasMore || isLoadingMore || loadMoreError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 160px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadState, hasMore, isLoadingMore, loadMoreError, onLoadMore]);

  const isEmpty = tasks.length === 0 && loadState === 'success';

  const hasActiveSearch = searchValue.trim().length > 0;

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
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search tasks"
            placeholder="Search tasks..."
            autoComplete="off"
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

      {loadState === 'loading' && (
        <div
          role="status"
          aria-label="Loading tasks"
          className="bg-surface mt-7 animate-pulse rounded-md p-4"
        >
          <div className="bg-surface-icon h-3 w-3/4 rounded-xs" />
          <div className="bg-surface-icon mt-3 h-3 w-1/2 rounded-xs" />
        </div>
      )}

      {loadState === 'error' && (
        <div
          role="alert"
          className="bg-surface mt-7 flex flex-col items-center gap-3 rounded-md p-5 text-center"
        >
          <p className="text-error text-sm">Failed to load tasks.</p>

          <button
            type="button"
            onClick={onRetry}
            className="text-primary text-sm font-semibold underline"
          >
            Try Again
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="bg-surface-low/30 border-outline/30 mt-7 flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
          <NoTasksIcon aria-hidden="true" />

          <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
            {hasActiveSearch ? 'No Matching Tasks' : 'No Tasks'}
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <div aria-label="Tasks" className="mt-7 flex min-w-0 flex-col gap-3">
          {tasks.map((task) => (
            <BoardTaskCard
              canMove={canMove && loadState === 'success'}
              key={task.id}
              task={task}
              mobile
              onTaskClick={onTaskClick}
              assigneeName={
                task.assignee_id ? (assigneeNamesById.get(task.assignee_id) ?? null) : null
              }
            />
          ))}

          {hasMore && !loadMoreError && (
            <div ref={sentinelRef} aria-hidden="true" className="h-1 shrink-0" />
          )}

          {isLoadingMore && (
            <div
              role="status"
              aria-label="Loading more tasks"
              className="text-foreground-secondary py-4 text-center text-xs"
            >
              Loading more tasks...
            </div>
          )}

          {loadMoreError && (
            <div role="alert" className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-error text-xs">Failed to load more tasks.</p>

              <button
                type="button"
                onClick={onRetryLoadMore}
                className="text-primary text-sm font-semibold underline"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
