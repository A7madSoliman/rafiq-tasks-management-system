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

const task = {
  id: TASK_ID,
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  title: 'Build dashboard',
  description: null,
  epic_id: null,
  assignee_id: USER_ID,
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

  it.each(['?limit=0', '?limit=101', '?limit=invalid', '?offset=-1', '?offset=1.5'])(
    'rejects invalid pagination: %s',
    async (query) => {
      const response = await GET(createRequest(query), context);

      expect(response.status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('rejects requests without an active session', async () => {
    authMocks.getCookie.mockReturnValue(undefined);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(401);
    expect(authMocks.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    authMocks.verifyAccessToken.mockResolvedValue(null);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a user outside the project', async () => {
    const fetchMock = mockProjectAccess([]);

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(403);

    // Project and membership checks only.
    // No task data should be fetched.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows a project viewer to read tasks', async () => {
    const fetchMock = mockProjectAccess([{ ...member, role: 'viewer' }]);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([task]), {
        status: 200,
        headers: {
          'Content-Range': '0-0/1',
        },
      }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-range')).toBe('0-0/1');

    await expect(response.json()).resolves.toEqual([task]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('applies project isolation and pagination', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([task]), {
        status: 200,
        headers: {
          'Content-Range': '3-3/4',
        },
      }),
    );

    const response = await GET(createRequest('?limit=2&offset=3'), context);

    expect(response.status).toBe(200);

    const [tasksUrl, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.pathname).toBe('/rest/v1/tasks');
    expect(tasksUrl.searchParams.get('project_id')).toBe(`eq.${PROJECT_ID}`);
    expect(tasksUrl.searchParams.get('limit')).toBe('2');
    expect(tasksUrl.searchParams.get('offset')).toBe('3');
    expect(options.method).toBe('GET');
    expect(options.cache).toBe('no-store');
    expect(response.headers.get('content-range')).toBe('3-3/4');
  });

  it('rejects tasks belonging to another project', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            ...task,
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

  it('handles Supabase task loading failure', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Internal error' }), { status: 500 }),
    );

    const response = await GET(createRequest(), context);

    expect(response.status).toBe(502);
  });
});
