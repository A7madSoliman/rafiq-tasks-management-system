'use client';

import { useCallback, useState } from 'react';

import { useCurrentProject } from '@/features/projects/context/current-project-context';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';

import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useIsDesktop } from '../hooks/use-is-desktop';
import { usePaginatedProjectTasks } from '../hooks/use-paginated-project-tasks';
import type { CreatedTask } from '../schemas/created-task-schema';
import { filterLocallyCreatedTasks } from '../utils/filter-locally-created-tasks';

import { CreateTaskDialog } from './create-task-dialog';
import { ProjectTasksBoardLoadingState } from './project-tasks-board-loading-state';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { TaskBoardMobileScreen } from './task-board-mobile-screen';
import { TaskDetailsDialog } from './task-details-dialog';
import type { TaskUpdateEvent } from '../types/task-update-event';

type LocalTasksState = {
  projectId: string;
  tasks: CreatedTask[];
};

type SelectedTask = {
  projectId: string;
  taskId: string;
};

type DesktopPaginatedColumnProps = {
  refreshRevision: number;
  projectId: string;
  status: (typeof TASK_STATUSES)[number];
  searchTerm: string;
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
};

type MobileTasksContentProps = {
  refreshRevision: number;
  projectId: string;
  searchTerm: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  onAddTask: () => void;
  onTaskClick: (taskId: string) => void;
};

/**
 * Desktop:
 * Every status column keeps its independent pagination.
 * All columns share the same search term.
 */
function DesktopPaginatedColumn({
  refreshRevision,
  projectId,
  status,
  searchTerm,
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
  } = usePaginatedProjectTasks(projectId, status.value, true, searchTerm, refreshRevision);

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
 * Mobile:
 * All project tasks use one paginated list.
 */
function MobileTasksContent({
  refreshRevision,
  projectId,
  searchTerm,
  searchValue,
  onSearchChange,
  localTasks,
  assigneeNamesById,
  onAddTask,
  onTaskClick,
}: MobileTasksContentProps) {
  const {
    tasks: paginatedTasks,
    status: loadState,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
    retry,
    retryLoadMore,
  } = usePaginatedProjectTasks(projectId, null, true, searchTerm, refreshRevision);

  const loadedTaskIds = new Set(paginatedTasks.map((task) => task.id));

  const visibleTasks = [
    ...localTasks.filter((task) => !loadedTaskIds.has(task.id)),
    ...paginatedTasks,
  ];

  return (
    <TaskBoardMobileScreen
      tasks={visibleTasks}
      assigneeNamesById={assigneeNamesById}
      onAddTask={onAddTask}
      onTaskClick={onTaskClick}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      loadState={loadState}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
      onRetry={retry}
      onRetryLoadMore={retryLoadMore}
    />
  );
}

export function ProjectTasksBoardScreen() {
  const {
    projectId,
    status: projectStatus,
    errorMessage: projectError,
    retry: retryProject,
  } = useCurrentProject();

  const isDesktop = useIsDesktop();

  /**
   * Search is controlled at the screen level.
   * Desktop and mobile use the same state.
   */
  const [searchInput, setSearchInput] = useState('');

  /**
   * The API only receives the search after
   * the user stops typing for 400ms.
   */
  const debouncedSearchTerm = useDebouncedValue(searchInput, 400);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>('TO_DO');

  const [localTasksState, setLocalTasksState] = useState<LocalTasksState>({
    projectId: '',
    tasks: [],
  });

  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);

  const {
    members,
    status: membersStatus,
    retry: retryMembers,
  } = useProjectMembers(projectId ?? '');

  const assigneeNamesById = new Map<string, string>(
    members.map((member) => [member.userId, member.name]),
  );

  /**
   * Keep locally created tasks scoped to
   * the selected project AND the current search.
   */
  const projectLocalTasks = localTasksState.projectId === projectId ? localTasksState.tasks : [];

  const localTasks = filterLocallyCreatedTasks(projectLocalTasks, debouncedSearchTerm);

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

  function handleTaskUpdated(event: TaskUpdateEvent) {
    if (event.projectId !== projectId) return;
    setLocalTasksState((current) =>
      current.projectId !== event.projectId
        ? current
        : {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === event.taskId ? { ...task, ...event.changes } : task,
            ),
          },
    );
    if ('assignee_id' in event.changes) retryMembers();
    setRefreshRevision((revision) => revision + 1);
  }

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
      <TaskBoardDesktopHeader searchValue={searchInput} onSearchChange={setSearchInput} />

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
                  refreshRevision={refreshRevision}
                  key={`${projectId}:${status.value}`}
                  projectId={projectId}
                  status={status}
                  searchTerm={debouncedSearchTerm}
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
          refreshRevision={refreshRevision}
          key={projectId}
          projectId={projectId}
          searchTerm={debouncedSearchTerm}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
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

      <TaskDetailsDialog
        projectId={projectId}
        taskId={selectedTaskId}
        onClose={handleCloseTask}
        onUpdated={handleTaskUpdated}
      />
    </div>
  );
}
