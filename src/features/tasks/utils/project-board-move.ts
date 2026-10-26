import type { TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';
import type { TaskMoveIntent } from './task-board-move-intent';

export type BoardMove = {
  intent: TaskMoveIntent;
  task: CreatedTask;
  phase: 'pending' | 'confirmed';
  uncertain?: boolean;
  baseRevisions: Record<TaskStatus, number>;
  baseMobileRevision: number;
};

export function projectBoardColumn(
  tasks: readonly CreatedTask[],
  totalCount: number,
  status: TaskStatus,
  move: BoardMove | null,
  matchesSearch: boolean,
  fresh = false,
  alreadyCountedInDestination = false,
) {
  if (!move || !matchesSearch || (fresh && !move.uncertain))
    return { tasks: [...tasks], totalCount };
  const { task, intent } = move;
  const withoutMoved = tasks.filter((item) => item.id !== task.id);
  if (status === intent.sourceStatus) {
    return { tasks: withoutMoved, totalCount: fresh ? totalCount : Math.max(0, totalCount - 1) };
  }
  if (status === intent.destinationStatus) {
    return {
      tasks: [{ ...task, status: intent.destinationStatus }, ...withoutMoved],
      totalCount: totalCount + (fresh || alreadyCountedInDestination ? 0 : 1),
    };
  }
  return { tasks: move.uncertain ? withoutMoved : [...tasks], totalCount };
}

export function projectMobileTasks(
  tasks: readonly CreatedTask[],
  move: BoardMove | null,
  fresh = false,
) {
  if (!move || (fresh && !move.uncertain)) return [...tasks];
  return tasks.map((task) =>
    task.id === move.intent.taskId ? { ...task, status: move.intent.destinationStatus } : task,
  );
}
