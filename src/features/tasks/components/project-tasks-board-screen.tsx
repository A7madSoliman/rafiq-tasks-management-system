'use client';

import { useCallback, useState } from 'react';

import { TASK_STATUSES } from '../constants/task-statuses';

import { CreateTaskDialog } from './create-task-dialog';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { TaskBoardMobileEmptyState } from './task-board-mobile-empty-state';

export function ProjectTasksBoardScreen() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const handleOpenCreateTask = useCallback(() => {
    setIsCreateTaskOpen(true);
  }, []);

  const handleCloseCreateTask = useCallback(() => {
    setIsCreateTaskOpen(false);
  }, []);

  return (
    <div className="min-w-0">
      <TaskBoardDesktopHeader />

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
                count={0}
                onAddTask={handleOpenCreateTask}
              />
            ))}
          </div>
        </div>
      </section>

      <TaskBoardMobileEmptyState onAddTask={handleOpenCreateTask} />

      <CreateTaskDialog isOpen={isCreateTaskOpen} onClose={handleCloseCreateTask} />
    </div>
  );
}
