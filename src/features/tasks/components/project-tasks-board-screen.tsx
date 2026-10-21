'use client';

import { useCallback, useState } from 'react';
import { useCurrentProject } from '@/features/projects/context/current-project-context';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import { useIsDesktop } from '../hooks/use-is-desktop';
import { usePaginatedProjectTasks } from '../hooks/use-paginated-project-tasks';
import { useProjectTasks } from '../hooks/use-project-tasks';
import type { CreatedTask } from '../schemas/created-task-schema';
import { CreateTaskDialog } from './create-task-dialog';
import { ProjectTasksBoardLoadingState } from './project-tasks-board-loading-state';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { TaskBoardMobileScreen } from './task-board-mobile-screen';
import { TaskDetailsDialog } from './task-details-dialog';

type LocalTasksState = {
  projectId: string;
  tasks: CreatedTask[];
};

type SelectedTask = {
  projectId: string;
  taskId: string;
};

type DesktopPaginatedColumnProps = {
  projectId: string;
  status: (typeof TASK_STATUSES)[number];
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
};

type MobileTasksContentProps = {
  projectId: string;
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: () => void;
  onTaskClick: (taskId: string) => void;
};

/**
 * Each desktop status column owns its own pagination state.
 */
function DesktopPaginatedColumn({
  projectId,
  status,
  localTasks,
  assigneeNamesById,
  onAddTask,
  onTaskClick,
}: DesktopPaginatedColumnProps) {
  const {
    tasks: paginatedTasks,
    totalCount,
    status: loadState,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
    retry,
    retryLoadMore,
  } = usePaginatedProjectTasks(projectId, status.value);

  // Avoid displaying newly created tasks twice.
  const loadedTaskIds = new Set(paginatedTasks.map((task) => task.id));

  const localColumnTasks = localTasks.filter(
    (task) => task.status === status.value && !loadedTaskIds.has(task.id),
  );

  const visibleTasks = [...localColumnTasks, ...paginatedTasks];

  return (
    <TaskBoardColumn
      status={status}
      tasks={visibleTasks}
      totalCount={totalCount}
      loadState={loadState}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
      onRetry={retry}
      onRetryLoadMore={retryLoadMore}
      onAddTask={() => onAddTask(status.value)}
      onTaskClick={onTaskClick}
      assigneeNamesById={assigneeNamesById}
    />
  );
}

/**
 * Temporary mobile data adapter.
 *
 * Phase 4 will replace the old multi-column data fetching
 * with a single unfiltered paginated request stream.
 */
function MobileTasksContent({
  projectId,
  localTasks,
  assigneeNamesById,
  onAddTask,
  onTaskClick,
}: MobileTasksContentProps) {
  const { columns, retryColumn } = useProjectTasks(projectId);

  const savedTasks = TASK_STATUSES.flatMap(({ value }) => columns[value]?.tasks ?? []);

  const isTasksLoading = TASK_STATUSES.some(
    ({ value }) => !columns[value] || columns[value]?.status === 'loading',
  );

  const failedStatuses = TASK_STATUSES.filter(
    ({ value }) => columns[value]?.status === 'error',
  ).map(({ value, label }) => ({
    value,
    label,
  }));

  const savedTaskIds = new Set(savedTasks.map((task) => task.id));

  const visibleTasks = [...localTasks.filter((task) => !savedTaskIds.has(task.id)), ...savedTasks];

  return (
    <TaskBoardMobileScreen
      tasks={visibleTasks}
      assigneeNamesById={assigneeNamesById}
      onAddTask={onAddTask}
      isLoading={isTasksLoading}
      failedStatuses={failedStatuses}
      onRetryStatus={(status) => {
        void retryColumn(status);
      }}
      onTaskClick={onTaskClick}
    />
  );
}

/**
 * Shared screen state:
 * - Project context
 * - Create Task dialog
 * - Task Details dialog
 * - Newly created tasks
 *
 * Desktop and Mobile data loading are intentionally separated.
 */
export function ProjectTasksBoardScreen() {
  const {
    projectId,
    status: projectStatus,
    errorMessage: projectError,
    retry: retryProject,
  } = useCurrentProject();

  const isDesktop = useIsDesktop();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>('TO_DO');

  const [localTasksState, setLocalTasksState] = useState<LocalTasksState>({
    projectId: '',
    tasks: [],
  });

  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);

  const {
    members,
    status: membersStatus,
    retry: retryMembers,
  } = useProjectMembers(projectId ?? '');

  const assigneeNamesById = new Map<string, string>(
    members.map((member) => [member.userId, member.name]),
  );

  // Keep locally created tasks scoped to their project.
  const localTasks = localTasksState.projectId === projectId ? localTasksState.tasks : [];

  const handleOpenCreateTask = useCallback((status: TaskStatus) => {
    setInitialTaskStatus(status);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCloseCreateTask = useCallback(() => {
    setIsCreateTaskOpen(false);
  }, []);

  const handleOpenTask = useCallback(
    (taskId: string) => {
      if (!projectId) {
        return;
      }

      setSelectedTask({
        projectId,
        taskId,
      });
    },
    [projectId],
  );

  const handleCloseTask = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const selectedTaskId = selectedTask?.projectId === projectId ? selectedTask.taskId : null;

  const handleTaskCreated = useCallback(
    (task: CreatedTask) => {
      if (!projectId || task.project_id !== projectId) {
        return;
      }

      setLocalTasksState((current) => {
        const currentTasks = current.projectId === projectId ? current.tasks : [];

        if (currentTasks.some((existing) => existing.id === task.id)) {
          return current;
        }

        return {
          projectId,
          tasks: [task, ...currentTasks],
        };
      });
    },
    [projectId],
  );

  // Project loading/error states.
  if (projectStatus === 'error') {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-error text-sm">
          {projectError ?? 'Unable to load project.'}
        </p>

        <button
          type="button"
          onClick={retryProject}
          className="text-primary cursor-pointer text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (projectStatus !== 'success' || !projectId || isDesktop === null) {
    return <ProjectTasksBoardLoadingState />;
  }

  return (
    <div className="min-w-0">
      <TaskBoardDesktopHeader />

      {membersStatus === 'error' && (
        <div role="alert" className="mx-8 mb-4 flex items-center gap-4">
          <p className="text-error text-sm">Unable to load task assignees.</p>

          <button
            type="button"
            onClick={retryMembers}
            className="text-primary cursor-pointer text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {isDesktop ? (
        <section aria-label="Tasks Kanban board" className="min-w-0">
          <div
            role="region"
            aria-label="Task status columns"
            tabIndex={0}
            className="w-full overflow-x-auto px-8 pb-8"
          >
            <div className="flex h-[calc(100dvh-282px)] min-h-[520px] w-max gap-6 pb-4">
              {TASK_STATUSES.map((status) => (
                <DesktopPaginatedColumn
                  key={`${projectId}:${status.value}`}
                  projectId={projectId}
                  status={status}
                  localTasks={localTasks}
                  assigneeNamesById={assigneeNamesById}
                  onAddTask={handleOpenCreateTask}
                  onTaskClick={handleOpenTask}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <MobileTasksContent
          key={projectId}
          projectId={projectId}
          localTasks={localTasks}
          assigneeNamesById={assigneeNamesById}
          onAddTask={() => handleOpenCreateTask('TO_DO')}
          onTaskClick={handleOpenTask}
        />
      )}

      <CreateTaskDialog
        projectId={projectId}
        isOpen={isCreateTaskOpen}
        onClose={handleCloseCreateTask}
        onCreated={handleTaskCreated}
        initialStatus={initialTaskStatus}
      />

      <TaskDetailsDialog projectId={projectId} taskId={selectedTaskId} onClose={handleCloseTask} />
    </div>
  );
}
