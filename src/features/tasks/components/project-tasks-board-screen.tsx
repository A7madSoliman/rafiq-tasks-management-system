'use client';

import { useCallback, useEffect, useState } from 'react';

import { useCurrentProject } from '@/features/projects/context/current-project-context';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';

import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { useIsDesktop } from '../hooks/use-is-desktop';
import { usePaginatedProjectTasks } from '../hooks/use-paginated-project-tasks';
import { useBoardTaskMove } from '../hooks/use-board-task-move';
import type { CreatedTask } from '../schemas/created-task-schema';
import { filterLocallyCreatedTasks } from '../utils/filter-locally-created-tasks';
import {
  projectBoardColumn,
  projectMobileTasks,
  type BoardMove,
} from '../utils/project-board-move';
import { normalizeTaskSearchTerm } from '../utils/project-task-search-query';

import { CreateTaskDialog } from './create-task-dialog';
import { ProjectTasksBoardLoadingState } from './project-tasks-board-loading-state';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { TaskBoardMobileScreen } from './task-board-mobile-screen';
import { TaskDetailsDialog } from './task-details-dialog';
import type { TaskUpdateEvent } from '../types/task-update-event';
import { TaskBoardDragDrop } from './task-board-drag-drop';

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
  moveRevision: number;
  projectId: string;
  status: (typeof TASK_STATUSES)[number];
  searchTerm: string;
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  move: BoardMove | null;
  moving: boolean;
  onLoaded: (status: TaskStatus, revision: number) => void;
  onAddTask: (status: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
};

type MobileTasksContentProps = {
  refreshRevision: number;
  moveRevision: number;
  projectId: string;
  searchTerm: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  localTasks: readonly CreatedTask[];
  assigneeNamesById: ReadonlyMap<string, string>;
  move: BoardMove | null;
  moving: boolean;
  onLoaded: (revision: number) => void;
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
  moveRevision,
  projectId,
  status,
  searchTerm,
  localTasks,
  assigneeNamesById,
  move,
  moving,
  onLoaded,
  onAddTask,
  onTaskClick,
}: DesktopPaginatedColumnProps) {
  const {
    canEdit,
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

  useEffect(() => {
    if (loadState === 'success') onLoaded(status.value, moveRevision);
  }, [loadState, onLoaded, moveRevision, status.value]);

  const loadedTaskIds = new Set(paginatedTasks.map((task) => task.id));

  const localColumnTasks = localTasks.filter(
    (task) => task.status === status.value && !loadedTaskIds.has(task.id),
  );

  const projected = projectBoardColumn(
    [...localColumnTasks, ...paginatedTasks],
    totalCount,
    status.value,
    move,
    !searchTerm ||
      normalizeTaskSearchTerm(move?.task.title ?? '').includes(normalizeTaskSearchTerm(searchTerm)),
    move?.phase === 'confirmed' &&
      moveRevision > move.baseRevisions[status.value] &&
      loadState === 'success',
    paginatedTasks.some((task) => task.id === move?.intent.taskId),
  );

  return (
    <TaskBoardColumn
      canMove={canEdit === true && !moving}
      status={status}
      tasks={projected.tasks}
      totalCount={projected.totalCount}
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
  moveRevision,
  projectId,
  searchTerm,
  searchValue,
  onSearchChange,
  localTasks,
  assigneeNamesById,
  move,
  moving,
  onLoaded,
  onAddTask,
  onTaskClick,
}: MobileTasksContentProps) {
  const {
    canEdit,
    tasks: paginatedTasks,
    status: loadState,
    hasMore,
    isLoadingMore,
    loadMoreError,
    loadMore,
    retry,
    retryLoadMore,
  } = usePaginatedProjectTasks(projectId, null, true, searchTerm, refreshRevision);

  useEffect(() => {
    if (loadState === 'success') onLoaded(moveRevision);
  }, [loadState, onLoaded, moveRevision]);

  const loadedTaskIds = new Set(paginatedTasks.map((task) => task.id));

  const visibleTasks = [
    ...localTasks.filter((task) => !loadedTaskIds.has(task.id)),
    ...paginatedTasks,
  ];

  return (
    <TaskBoardMobileScreen
      canMove={canEdit === true && !moving}
      tasks={projectMobileTasks(
        visibleTasks,
        move,
        move?.phase === 'confirmed' &&
          moveRevision > move.baseMobileRevision &&
          loadState === 'success',
      )}
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
  const handleMoveConfirmed = useCallback(
    (intent: { projectId: string; taskId: string; destinationStatus: TaskStatus }) => {
      setLocalTasksState((current) =>
        current.projectId !== intent.projectId
          ? current
          : {
              ...current,
              tasks: current.tasks.map((task) =>
                task.id === intent.taskId ? { ...task, status: intent.destinationStatus } : task,
              ),
            },
      );
    },
    [],
  );
  const handleMoveUncertain = useCallback((intent: { projectId: string; taskId: string }) => {
    setLocalTasksState((current) =>
      current.projectId !== intent.projectId
        ? current
        : {
            ...current,
            tasks: current.tasks.filter((task) => task.id !== intent.taskId),
          },
    );
  }, []);
  const boardMove = useBoardTaskMove(
    projectId,
    isDesktop === false,
    handleMoveConfirmed,
    handleMoveUncertain,
  );

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
      if (!projectId || boardMove.moving) {
        return;
      }

      setSelectedTask({
        projectId,
        taskId,
      });
    },
    [projectId, boardMove.moving],
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
    <TaskBoardDragDrop
      key={projectId}
      projectId={projectId}
      mobile={!isDesktop}
      searchKey={JSON.stringify([searchInput, debouncedSearchTerm])}
      disabled={isCreateTaskOpen || selectedTaskId !== null || boardMove.moving}
      onMoveIntent={boardMove.start}
    >
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
                    refreshRevision={refreshRevision + boardMove.revisions[status.value]}
                    moveRevision={boardMove.revisions[status.value]}
                    key={`${projectId}:${status.value}`}
                    projectId={projectId}
                    status={status}
                    searchTerm={debouncedSearchTerm}
                    localTasks={localTasks}
                    assigneeNamesById={assigneeNamesById}
                    move={boardMove.move}
                    moving={boardMove.moving}
                    onLoaded={boardMove.acknowledge}
                    onAddTask={handleOpenCreateTask}
                    onTaskClick={handleOpenTask}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <MobileTasksContent
            refreshRevision={refreshRevision + boardMove.mobileRevision}
            moveRevision={boardMove.mobileRevision}
            key={projectId}
            projectId={projectId}
            searchTerm={debouncedSearchTerm}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            localTasks={localTasks}
            assigneeNamesById={assigneeNamesById}
            move={boardMove.move}
            moving={boardMove.moving}
            onLoaded={(revision) => boardMove.acknowledge('mobile', revision)}
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
    </TaskBoardDragDrop>
  );
}
