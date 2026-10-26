import { z } from 'zod';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';

const statusSchema = z.enum(TASK_STATUSES.map((status) => status.value));

export const boardDragSourceSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
  sourceStatus: statusSchema,
  title: z.string(),
  canEdit: z.literal(true),
  mobile: z.boolean(),
});

export const boardDropTargetSchema = z.object({
  projectId: z.uuid(),
  status: statusSchema,
  available: z.literal(true),
});

export type BoardDragSource = z.infer<typeof boardDragSourceSchema>;
export type TaskMoveIntent = {
  projectId: string;
  taskId: string;
  sourceStatus: TaskStatus;
  destinationStatus: TaskStatus;
};

export function getTaskMoveIntent({
  projectId,
  source,
  target,
  canceled,
  disabled,
}: {
  projectId: string;
  source: unknown;
  target: unknown;
  canceled: boolean;
  disabled: boolean;
}): TaskMoveIntent | null {
  if (canceled || disabled) return null;
  const from = boardDragSourceSchema.safeParse(source);
  const to = boardDropTargetSchema.safeParse(target);
  if (
    !from.success ||
    !to.success ||
    from.data.projectId !== projectId ||
    to.data.projectId !== projectId ||
    from.data.sourceStatus === to.data.status
  )
    return null;
  return {
    projectId,
    taskId: from.data.taskId,
    sourceStatus: from.data.sourceStatus,
    destinationStatus: to.data.status,
  };
}

export function getKeyboardTargetStatus(
  current: TaskStatus,
  direction: 'up' | 'down' | 'left' | 'right',
  mobile: boolean,
  available: ReadonlySet<TaskStatus>,
): TaskStatus | null {
  const index = TASK_STATUSES.findIndex((status) => status.value === current);
  if (!mobile && (direction === 'up' || direction === 'down')) return null;
  const step = direction === 'left' ? -1 : direction === 'right' ? 1 : direction === 'up' ? -2 : 2;
  for (let next = index + step; next >= 0 && next < TASK_STATUSES.length; next += step) {
    if (mobile && Math.abs(step) === 1 && Math.floor(next / 2) !== Math.floor(index / 2))
      return null;
    const value = TASK_STATUSES[next].value;
    if (available.has(value)) return value;
  }
  return null;
}
