'use client';

import { useCallback, useState } from 'react';
import { useCurrentProject } from '@/features/projects/context/current-project-context';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import { useProjectTasks } from '../hooks/use-project-tasks';
import type { CreatedTask } from '../schemas/created-task-schema';
import { CreateTaskDialog } from './create-task-dialog';
import { ProjectTasksBoardLoadingState } from './project-tasks-board-loading-state';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
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

export function ProjectTasksBoardScreen() {
  const {
    projectId,
    status: projectStatus,
    errorMessage: projectError,
    retry: retryProject,
  } = useCurrentProject();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>('TO_DO');
  const [localTasksState, setLocalTasksState] = useState<LocalTasksState>({
    projectId: '',
    tasks: [],
  });
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);

  const { columns, retryColumn } = useProjectTasks(projectId ?? '');
  const {
    members,
    status: membersStatus,
    retry: retryMembers,
  } = useProjectMembers(projectId ?? '');

  const assigneeNamesById = new Map<string, string>(
    members.map((member) => [member.userId, member.name]),
  );

  const localTasks = localTasksState.projectId === projectId ? localTasksState.tasks : [];

  const savedTasks = TASK_STATUSES.flatMap(({ value }) => columns[value]?.tasks ?? []);

  const isTasksLoading = TASK_STATUSES.some(
    ({ value }) => !columns[value] || columns[value]?.status === 'loading',
  );

  const failedStatuses = TASK_STATUSES.filter(
    ({ value }) => columns[value]?.status === 'error',
  ).map(({ value, label }) => ({ value, label }));

  const savedTaskIds = new Set(savedTasks.map((task) => task.id));

  const visibleTasks = [...localTasks.filter((task) => !savedTaskIds.has(task.id)), ...savedTasks];

  const handleOpenCreateTask = useCallback((status: TaskStatus) => {
    setInitialTaskStatus(status);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCloseCreateTask = useCallback(() => {
    setIsCreateTaskOpen(false);
  }, []);

  const handleOpenTask = useCallback(
    (taskId: string) => {
      if (!projectId) return;

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

  // Handle project loading failure before rendering its details.
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

  if (projectStatus !== 'success') {
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

      <section aria-label="Tasks Kanban board" className="hidden min-w-0 lg:block">
        <div
          role="region"
          aria-label="Task status columns"
          tabIndex={0}
          className="w-full overflow-x-auto px-8 pb-8"
        >
          <div className="flex h-[calc(100dvh-282px)] min-h-[520px] w-max gap-6 pb-4">
            {TASK_STATUSES.map((status) => (
              <TaskBoardColumn
                key={status.value}
                status={status}
                tasks={visibleTasks.filter((task) => task.status === status.value)}
                loadState={columns[status.value]?.status ?? 'loading'}
                onRetry={() => void retryColumn(status.value)}
                assigneeNamesById={assigneeNamesById}
                onAddTask={() => handleOpenCreateTask(status.value)}
                onTaskClick={handleOpenTask}
              />
            ))}
          </div>
        </div>
      </section>

      <TaskBoardMobileScreen
        tasks={visibleTasks}
        assigneeNamesById={assigneeNamesById}
        onAddTask={() => handleOpenCreateTask('TO_DO')}
        isLoading={isTasksLoading}
        failedStatuses={failedStatuses}
        onRetryStatus={(status) => void retryColumn(status)}
        onTaskClick={handleOpenTask}
      />
      {projectId && (
        <CreateTaskDialog
          projectId={projectId}
          isOpen={isCreateTaskOpen}
          onClose={handleCloseCreateTask}
          onCreated={handleTaskCreated}
          initialStatus={initialTaskStatus}
        />
      )}

      {projectId && (
        <TaskDetailsDialog
          projectId={projectId}
          taskId={selectedTaskId}
          onClose={handleCloseTask}
        />
      )}
    </div>
  );
}
