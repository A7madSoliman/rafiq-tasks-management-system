import type { CreatedTask } from '../schemas/created-task-schema';

type MergedTaskPage = {
  tasks: CreatedTask[];
  nextOffset: number;
};

export function mergeTaskPage(
  existingTasks: readonly CreatedTask[],
  incomingTasks: readonly CreatedTask[],
  offset: number,
): MergedTaskPage {
  const existingIds = new Set(existingTasks.map((task) => task.id));
  const tasks = [...existingTasks];

  for (const task of incomingTasks) {
    if (existingIds.has(task.id)) {
      continue;
    }

    existingIds.add(task.id);
    tasks.push(task);
  }

  return {
    tasks,
    nextOffset: offset + incomingTasks.length,
  };
}
