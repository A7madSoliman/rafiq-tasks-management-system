import type { UpdateTask } from '../schemas/update-task-schema';

// Only confirmed changed fields; due_date uses the persisted timestamp for list data.
export type TaskUpdateEvent = {
  projectId: string;
  taskId: string;
  changes: UpdateTask;
};
