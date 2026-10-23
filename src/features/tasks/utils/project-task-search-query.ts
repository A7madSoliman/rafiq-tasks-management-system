import type { TaskStatus } from '../constants/task-statuses';

type TaskPageParams = {
  limit: number;
  offset: number;
  statusFilter: TaskStatus | null;
  searchTerm: string;
};

/**
 * Normalize equivalent searches to the same query.
 * "  LOGIN  " and "login" should behave identically.
 */
export function normalizeTaskSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Each project, status, and search combination
 * must have its own pagination state.
 */
export function createTaskQueryKey(
  projectId: string,
  statusFilter: TaskStatus | null,
  searchTerm: string,
): string {
  return JSON.stringify([projectId, statusFilter, normalizeTaskSearchTerm(searchTerm)]);
}

/**
 * Build the request to our Next.js API.
 * The API is responsible for translating "search"
 * into the Supabase "title=ilike..." filter.
 */
export function buildTaskPageParams({
  limit,
  offset,
  statusFilter,
  searchTerm,
}: TaskPageParams): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (statusFilter !== null) {
    params.set('status', statusFilter);
  }

  const normalizedSearchTerm = normalizeTaskSearchTerm(searchTerm);

  if (normalizedSearchTerm) {
    params.set('search', normalizedSearchTerm);
  }

  return params;
}
