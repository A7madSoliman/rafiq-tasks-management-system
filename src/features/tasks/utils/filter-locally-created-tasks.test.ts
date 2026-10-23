import { describe, expect, it } from 'vitest';

import type { CreatedTask } from '../schemas/created-task-schema';
import { filterLocallyCreatedTasks } from './filter-locally-created-tasks';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const baseTask: CreatedTask = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  title: 'Implement Login Page',
  description: null,
  epic_id: null,
  assignee_id: null,
  due_date: null,
  status: 'TO_DO',
};

const tasks: CreatedTask[] = [
  baseTask,
  {
    ...baseTask,
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    task_id: 'TASK-2',
    title: 'Fix LOGIN Validation',
  },
  {
    ...baseTask,
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    task_id: 'TASK-3',
    title: 'Design Dashboard',
  },
];

describe('filterLocallyCreatedTasks', () => {
  it('matches titles regardless of case', () => {
    const result = filterLocallyCreatedTasks(tasks, 'LOGIN');

    expect(result.map((task) => task.task_id)).toEqual(['TASK-1', 'TASK-2']);
  });

  it('matches any part of the title', () => {
    const result = filterLocallyCreatedTasks(tasks, 'Validation');

    expect(result).toHaveLength(1);
    expect(result[0]?.task_id).toBe('TASK-2');
  });

  it('trims the search term', () => {
    const result = filterLocallyCreatedTasks(tasks, '  dashboard  ');

    expect(result).toHaveLength(1);
    expect(result[0]?.task_id).toBe('TASK-3');
  });

  it('returns every task for an empty search', () => {
    expect(filterLocallyCreatedTasks(tasks, '')).toEqual(tasks);
    expect(filterLocallyCreatedTasks(tasks, '   ')).toEqual(tasks);
  });

  it('does not mutate the source array', () => {
    const original = [...tasks];

    filterLocallyCreatedTasks(tasks, 'login');

    expect(tasks).toEqual(original);
  });
});
