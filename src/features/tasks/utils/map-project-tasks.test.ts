import { describe, expect, it } from 'vitest';

import { mapProjectTasks } from './map-project-tasks';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TASK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const EPIC_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const backendTask = {
  id: TASK_ID,
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  epic_id: EPIC_ID,
  title: 'Build dashboard',
  description: null,
  status: 'BLOCKED',
  due_date: '2026-10-10T00:00:00+00:00',
  created_at: '2026-10-10T00:25:34+00:00',
  epic: {
    id: EPIC_ID,
    title: 'Dashboard Epic',
    epic_id: 'EPIC-1',
  },
  created_by: {
    id: USER_ID,
    name: 'Test User',
    email: 'test@example.com',
    department: 'Frontend',
  },
  assignee: {
    id: USER_ID,
    name: 'Test User',
    email: 'test@example.com',
    department: 'Frontend',
  },
};

describe('mapProjectTasks', () => {
  it('maps backend tasks to the existing frontend task model', () => {
    expect(mapProjectTasks([backendTask])).toEqual([
      {
        id: TASK_ID,
        task_id: 'TASK-1',
        project_id: PROJECT_ID,
        epic_id: EPIC_ID,
        assignee_id: USER_ID,
        title: 'Build dashboard',
        description: null,
        status: 'BLOCKED',
        due_date: '2026-10-10T00:00:00+00:00',
      },
    ]);
  });

  it('handles an unassigned task without an epic', () => {
    const result = mapProjectTasks([
      {
        ...backendTask,
        epic_id: null,
        epic: null,
        assignee: null,
      },
    ]);

    expect(result?.[0]).toMatchObject({
      epic_id: null,
      assignee_id: null,
    });
  });

  it('handles an assignee with a null ID', () => {
    const result = mapProjectTasks([
      {
        ...backendTask,
        assignee: {
          id: null,
          name: null,
        },
      },
    ]);

    expect(result?.[0]?.assignee_id).toBeNull();
  });

  it('accepts an empty task list', () => {
    expect(mapProjectTasks([])).toEqual([]);
  });

  it('rejects invalid task data', () => {
    expect(mapProjectTasks(null)).toBeNull();
    expect(mapProjectTasks({})).toBeNull();

    expect(
      mapProjectTasks([
        {
          ...backendTask,
          id: 'invalid',
        },
      ]),
    ).toBeNull();

    expect(
      mapProjectTasks([
        {
          ...backendTask,
          status: 'UNKNOWN',
        },
      ]),
    ).toBeNull();

    expect(
      mapProjectTasks([
        {
          ...backendTask,
          assignee: { id: 'invalid' },
        },
      ]),
    ).toBeNull();
  });
});
