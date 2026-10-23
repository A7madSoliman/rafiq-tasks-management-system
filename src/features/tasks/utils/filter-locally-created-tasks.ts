import type { CreatedTask } from '../schemas/created-task-schema';
import { normalizeTaskSearchTerm } from './project-task-search-query';

/**
 * Locally created tasks must obey the same title search
 * as tasks returned from the backend.
 */
export function filterLocallyCreatedTasks(
  tasks: readonly CreatedTask[],
  searchTerm: string,
): CreatedTask[] {
  const normalizedSearch = normalizeTaskSearchTerm(searchTerm);

  if (!normalizedSearch) {
    return [...tasks];
  }

  return tasks.filter((task) => normalizeTaskSearchTerm(task.title).includes(normalizedSearch));
}
