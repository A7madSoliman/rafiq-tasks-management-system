import { describe, expect, it } from 'vitest';

import type { CreatedTask } from '../schemas/created-task-schema';
import { mergeTaskPage } from './merge-task-page';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const taskA: CreatedTask = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  title: 'First task',
  description: null,
  epic_id: null,
  assignee_id: null,
  due_date: null,
  status: 'TO_DO',
};

const taskB: CreatedTask = {
  ...taskA,
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  task_id: 'TASK-2',
  title: 'Second task',
};

const taskC: CreatedTask = {
  ...taskA,
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  task_id: 'TASK-3',
  title: 'Third task',
};

describe('mergeTaskPage', () => {
  it('merges a first page', () => {
    const result = mergeTaskPage([], [taskA, taskB], 0);

    expect(result.tasks).toEqual([taskA, taskB]);
    expect(result.nextOffset).toBe(2);
  });

  it('appends new tasks without changing the existing order', () => {
    const result = mergeTaskPage([taskA], [taskB, taskC], 1);

    expect(result.tasks).toEqual([taskA, taskB, taskC]);
    expect(result.nextOffset).toBe(3);
  });

  it('removes duplicate IDs across pages and within a page', () => {
    const result = mergeTaskPage([taskA], [taskA, taskB, taskB], 10);

    expect(result.tasks).toEqual([taskA, taskB]);

    // Offset advances by received rows, not unique rows.
    expect(result.nextOffset).toBe(13);
  });

  it('does not mutate the original array', () => {
    const existing = [taskA];

    mergeTaskPage(existing, [taskB], 1);

    expect(existing).toEqual([taskA]);
  });

  it('handles an empty page', () => {
    const result = mergeTaskPage([taskA], [], 1);

    expect(result.tasks).toEqual([taskA]);
    expect(result.nextOffset).toBe(1);
  });
});
