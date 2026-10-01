import { describe, expect, it } from 'vitest';

import { mapProjectEpics } from './map-project-epics';

describe('mapProjectEpics', () => {
  it('maps a valid project epic response', () => {
    const result = mapProjectEpics([
      {
        id: 'epic-uuid-1',
        project_id: 'project-uuid-1',
        epic_id: 'EPIC-1',
        title: 'Authentication & Security Module',
        description: 'Design and implement auth features',
        created_at: '2026-09-28T16:39:52.751131+00:00',
        deadline: '2026-12-31',
        created_by: {
          sub: 'creator-user-id',
          name: 'Ahmad Soliman Dev',
          email: 'ahmadsolimandev@gmail.com',
          department: 'Frontend',
        },
        assignee: {
          sub: 'assignee-user-id',
          name: 'Ahmed Ashry',
          email: 'ashry@example.com',
          department: 'Front End',
        },
      },
    ]);

    expect(result).toEqual([
      {
        id: 'epic-uuid-1',
        projectId: 'project-uuid-1',
        epicId: 'EPIC-1',
        title: 'Authentication & Security Module',
        description: 'Design and implement auth features',
        createdAt: '2026-09-28T16:39:52.751131+00:00',
        deadline: '2026-12-31',
        createdBy: {
          userId: 'creator-user-id',
          name: 'Ahmad Soliman Dev',
          email: 'ahmadsolimandev@gmail.com',
          department: 'Frontend',
        },
        assignee: {
          userId: 'assignee-user-id',
          name: 'Ahmed Ashry',
          email: 'ashry@example.com',
          department: 'Front End',
        },
      },
    ]);
  });

  it('maps an empty assignee object to null', () => {
    const result = mapProjectEpics([
      {
        id: 'epic-uuid-2',
        project_id: 'project-uuid-1',
        epic_id: 'EPIC-2',
        title: 'Epic Without Assignee',
        description: null,
        created_at: '2026-09-28T16:48:43.039385+00:00',
        deadline: null,
        created_by: {
          sub: 'creator-user-id',
          name: 'Ahmad Soliman Dev',
          email: 'ahmadsolimandev@gmail.com',
          department: 'Frontend',
        },
        assignee: {
          sub: null,
          name: null,
          email: null,
          department: null,
        },
      },
    ]);

    expect(result).toEqual([
      {
        id: 'epic-uuid-2',
        projectId: 'project-uuid-1',
        epicId: 'EPIC-2',
        title: 'Epic Without Assignee',
        description: null,
        createdAt: '2026-09-28T16:48:43.039385+00:00',
        deadline: null,
        createdBy: {
          userId: 'creator-user-id',
          name: 'Ahmad Soliman Dev',
          email: 'ahmadsolimandev@gmail.com',
          department: 'Frontend',
        },
        assignee: null,
      },
    ]);
  });

  it('rejects an epic with an invalid creator', () => {
    const result = mapProjectEpics([
      {
        id: 'epic-uuid-1',
        project_id: 'project-uuid-1',
        epic_id: 'EPIC-1',
        title: 'Invalid Epic',
        description: null,
        created_at: '2026-09-28T16:39:52.751131+00:00',
        deadline: null,
        created_by: null,
        assignee: {
          sub: null,
          name: null,
          email: null,
          department: null,
        },
      },
    ]);

    expect(result).toBeNull();
  });

  it('rejects an invalid assignee shape', () => {
    const result = mapProjectEpics([
      {
        id: 'epic-uuid-1',
        project_id: 'project-uuid-1',
        epic_id: 'EPIC-1',
        title: 'Invalid Epic',
        description: null,
        created_at: '2026-09-28T16:39:52.751131+00:00',
        deadline: null,
        created_by: {
          sub: 'creator-user-id',
          name: 'Ahmad Soliman Dev',
          email: 'ahmadsolimandev@gmail.com',
          department: 'Frontend',
        },
        assignee: {
          sub: 'assignee-user-id',
          name: null,
          email: 'ashry@example.com',
          department: 'Front End',
        },
      },
    ]);

    expect(result).toBeNull();
  });

  it('rejects a non-array response', () => {
    expect(mapProjectEpics({})).toBeNull();
  });
});
