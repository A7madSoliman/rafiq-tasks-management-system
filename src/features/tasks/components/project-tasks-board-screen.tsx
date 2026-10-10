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

type LocalTasksState = {
  projectId: string;
  tasks: CreatedTask[];
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

  const {
    tasks: savedTasks,
    status: tasksStatus,
    retry: retryTasks,
  } = useProjectTasks(projectId ?? '');

  const {
    members,
    status: membersStatus,
    retry: retryMembers,
  } = useProjectMembers(projectId ?? '');

  const assigneeNamesById = new Map<string, string>(
    members.map((member) => [member.userId, member.name]),
  );

  const localTasks = localTasksState.projectId === projectId ? localTasksState.tasks : [];

  const savedTaskIds = new Set(savedTasks.map((task) => task.id));

  const visibleTasks = [...localTasks.filter((task) => !savedTaskIds.has(task.id)), ...savedTasks];

  const handleOpenCreateTask = useCallback((status: TaskStatus) => {
    setInitialTaskStatus(status);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCloseCreateTask = useCallback(() => {
    setIsCreateTaskOpen(false);
  }, []);

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

  if (projectStatus !== 'success' || tasksStatus === 'loading' || membersStatus === 'loading') {
    return <ProjectTasksBoardLoadingState />;
  }

  return (
    <div className="min-w-0">
      <TaskBoardDesktopHeader />

      {tasksStatus === 'error' && (
        <div role="alert" className="mx-8 mb-4 flex items-center gap-4">
          <p className="text-error text-sm">Unable to load saved tasks.</p>

          <button
            type="button"
            onClick={retryTasks}
            className="text-primary cursor-pointer text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      )}

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
                assigneeNamesById={assigneeNamesById}
                onAddTask={() => handleOpenCreateTask(status.value)}
              />
            ))}
          </div>
        </div>
      </section>

      <TaskBoardMobileScreen
        tasks={visibleTasks}
        assigneeNamesById={assigneeNamesById}
        onAddTask={() => handleOpenCreateTask('TO_DO')}
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
    </div>
  );
}
