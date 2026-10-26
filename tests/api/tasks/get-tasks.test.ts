import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: authMocks.getCookie,
  })),
}));

vi.mock('@/lib/auth/session', () => ({
  verifyAccessToken: authMocks.verifyAccessToken,
}));

import { GET } from '@/app/api/projects/[projectId]/tasks/route';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OWNER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TASK_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const context = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};

const member = {
  member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  project_id: PROJECT_ID,
  user_id: USER_ID,
  role: 'member',
  email: 'member@example.com',
  metadata: { name: 'Test Member' },
};

const backendTask = {
  id: TASK_ID,
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  epic_id: null,
  title: 'Build dashboard',
  description: null,
  due_date: '2026-10-15T00:00:00+00:00',
  created_at: '2026-10-10T00:00:00+00:00',
  status: 'IN_PROGRESS',
  epic: null,
  assignee: {
    id: USER_ID,
    name: 'Test Member',
    email: 'member@example.com',
    department: 'Frontend',
  },
};

const expectedTask = {
  id: TASK_ID,
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  epic_id: null,
  assignee_id: USER_ID,
  title: 'Build dashboard',
  description: null,
  due_date: '2026-10-15T00:00:00+00:00',
  status: 'IN_PROGRESS',
};

function createRequest(query = ''): Request {
  return new Request(`http://localhost:3000/api/projects/${PROJECT_ID}/tasks${query}`, {
    method: 'GET',
  });
}

function mockProjectAccess(members: unknown = [member]) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: PROJECT_ID,
            created_by: OWNER_ID,
          },
        ]),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(members), {
        status: 200,
      }),
    );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('GET /api/projects/[projectId]/tasks', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');

    authMocks.getCookie.mockReturnValue({
      value: 'valid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: USER_ID,
      email: null,
      name: null,
      jobTitle: null,
    });

    vi.stubGlobal('fetch', vi.fn());
  });

  it('rejects an invalid project ID', async () => {
    const response = await GET(createRequest(), {
      params: Promise.resolve({ projectId: 'invalid' }),
    });

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    '?limit=0',
    '?limit=101',
    '?limit=invalid',
    '?limit=1.5',
    '?offset=-1',
    '?offset=1.5',
    '?offset=invalid',
  ])('rejects invalid pagination parameters: %s', async (query) => {
    const response = await GET(createRequest(query), context);

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid task statuses', async () => {
    const response = await GET(createRequest('?status=INVALID'), context);

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects requests without an active session', async () => {
    authMocks.getCookie.mockReturnValue(undefined);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(401);
    expect(authMocks.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid access tokens', async () => {
    authMocks.verifyAccessToken.mockResolvedValue(null);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects users outside the project', async () => {
    const fetchMock = mockProjectAccess([]);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows project viewers to read tasks', async () => {
    const fetchMock = mockProjectAccess([{ ...member, role: 'viewer' }]);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 200,
        headers: {
          'Content-Range': '0-0/1',
        },
      }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Taskly-Can-Edit')).toBe('false');
    expect(response.headers.get('content-range')).toBe('0-0/1');

    await expect(response.json()).resolves.toEqual([expectedTask]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([
    { role: 'owner', userId: USER_ID, expected: true },
    { role: 'admin', userId: USER_ID, expected: true },
    { role: 'member', userId: USER_ID, expected: true },
    { role: null, userId: OWNER_ID, expected: true },
    { role: 'viewer', userId: OWNER_ID, expected: false },
  ])(
    'returns private edit permission for $role (creator: $userId)',
    async ({ role, userId, expected }) => {
      authMocks.verifyAccessToken.mockResolvedValue({ id: userId });
      const fetchMock = mockProjectAccess(role ? [{ ...member, user_id: userId, role }] : []);
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify([backendTask]), {
          headers: { 'Content-Range': '0-0/1' },
        }),
      );
      const response = await GET(createRequest(), context);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Taskly-Can-Edit')).toBe(String(expected));
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('Content-Range')).toBe('0-0/1');
      expect(await response.json()).toEqual([expectedTask]);
    },
  );

  it('applies project isolation and server-side pagination', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 206,
        headers: {
          'Content-Range': '10-10/17',
        },
      }),
    );

    const response = await GET(createRequest('?limit=10&offset=10'), context);

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('10-10/17');

    const [tasksUrl, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.pathname).toBe('/rest/v1/project_tasks');
    expect(tasksUrl.searchParams.get('project_id')).toBe(`eq.${PROJECT_ID}`);
    expect(tasksUrl.searchParams.get('limit')).toBe('10');
    expect(tasksUrl.searchParams.get('offset')).toBe('10');
    expect(tasksUrl.searchParams.get('order')).toBe('created_at.desc,id.desc');

    expect(options.method).toBe('GET');
    expect(options.cache).toBe('no-store');

    expect(options.headers).toMatchObject({
      apikey: 'test-secret-key',
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
    });

    await expect(response.json()).resolves.toEqual([expectedTask]);
  });

  it('filters tasks by the requested status', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 200,
        headers: {
          'Content-Range': '0-0/1',
        },
      }),
    );

    const response = await GET(createRequest('?status=IN_PROGRESS&limit=10&offset=0'), context);

    expect(response.status).toBe(200);

    const [tasksUrl] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.searchParams.get('project_id')).toBe(`eq.${PROJECT_ID}`);
    expect(tasksUrl.searchParams.get('status')).toBe('eq.IN_PROGRESS');
  });

  it('rejects tasks returned with the wrong status', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 200,
        headers: {
          'Content-Range': '0-0/1',
        },
      }),
    );

    const response = await GET(createRequest('?status=BLOCKED'), context);

    expect(response.status).toBe(502);
  });

  it('rejects tasks belonging to another project', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            ...backendTask,
            project_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          },
        ]),
        {
          status: 200,
          headers: {
            'Content-Range': '0-0/1',
          },
        },
      ),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);

    await expect(response.json()).resolves.toEqual({
      message: 'Invalid project tasks response.',
    });
  });

  it('returns an empty list when the project has no tasks', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Range': '*/0',
        },
      }),
    );

    const response = await GET(createRequest('?limit=10&offset=0'), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-range')).toBe('*/0');

    await expect(response.json()).resolves.toEqual([]);
  });

  it('preserves 416 and the backend total count', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 'PGRST103',
          message: 'Requested range not satisfiable',
        }),
        {
          status: 416,
          headers: {
            'Content-Range': '*/17',
          },
        },
      ),
    );

    const response = await GET(createRequest('?limit=10&offset=999999'), context);

    expect(response.status).toBe(416);
    expect(response.headers.get('content-range')).toBe('*/17');

    await expect(response.json()).resolves.toEqual({
      message: 'Requested task page is outside the available range.',
    });
  });

  it('handles missing pagination metadata', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 200,
      }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);

    await expect(response.json()).resolves.toEqual({
      message: 'Invalid pagination metadata.',
    });
  });

  it('handles malformed pagination metadata', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([backendTask]), {
        status: 200,
        headers: {
          'Content-Range': 'invalid',
        },
      }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);
  });

  it('handles an invalid backend task response', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ invalid: true }]), {
        status: 200,
        headers: {
          'Content-Range': '0-0/1',
        },
      }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);
  });

  it('handles Supabase loading failures', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Internal error' }), { status: 500 }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);
  });
});
