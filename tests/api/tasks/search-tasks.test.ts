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

const backendMember = {
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
  title: 'Implement Login Page',
  description: null,
  due_date: null,
  created_at: '2026-10-10T00:00:00+00:00',
  status: 'IN_PROGRESS',
  epic: null,
  assignee: null,
};

const expectedTask = {
  id: TASK_ID,
  task_id: 'TASK-1',
  project_id: PROJECT_ID,
  epic_id: null,
  assignee_id: null,
  title: 'Implement Login Page',
  description: null,
  due_date: null,
  status: 'IN_PROGRESS',
};

function createRequest(params: URLSearchParams): Request {
  return new Request(`http://localhost:3000/api/projects/${PROJECT_ID}/tasks?${params}`, {
    method: 'GET',
  });
}

function mockBackend(tasks: unknown, contentRange: string, responseStatus = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: PROJECT_ID, created_by: OWNER_ID }]), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify([backendMember]), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(tasks), {
        status: responseStatus,
        headers: {
          'Content-Range': contentRange,
        },
      }),
    );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('GET project tasks title search', () => {
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

  it('applies title search before pagination with project and status filters', async () => {
    const fetchMock = mockBackend([backendTask], '10-10/35', 206);

    const params = new URLSearchParams({
      search: '  LoGiN  ',
      status: 'IN_PROGRESS',
      limit: '10',
      offset: '10',
    });

    const response = await GET(createRequest(params), context);

    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('10-10/35');

    const [tasksUrl, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.pathname).toBe('/rest/v1/project_tasks');

    expect(tasksUrl.searchParams.get('project_id')).toBe(`eq.${PROJECT_ID}`);

    expect(tasksUrl.searchParams.get('title')).toBe('ilike.%LoGiN%');

    expect(tasksUrl.searchParams.get('status')).toBe('eq.IN_PROGRESS');

    expect(tasksUrl.searchParams.get('limit')).toBe('10');
    expect(tasksUrl.searchParams.get('offset')).toBe('10');

    expect(options.headers).toMatchObject({
      apikey: 'test-secret-key',
      Authorization: 'Bearer valid-token',
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
    });

    await expect(response.json()).resolves.toEqual([expectedTask]);
  });

  it('omits title filtering for whitespace-only search', async () => {
    const fetchMock = mockBackend([backendTask], '0-0/1');

    const params = new URLSearchParams({
      search: '   ',
      limit: '10',
      offset: '0',
    });

    const response = await GET(createRequest(params), context);

    expect(response.status).toBe(200);

    const [tasksUrl] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.searchParams.has('title')).toBe(false);
    expect(tasksUrl.searchParams.get('project_id')).toBe(`eq.${PROJECT_ID}`);
  });

  it('URL-encodes special characters in search terms', async () => {
    const fetchMock = mockBackend([], '*/0');

    const params = new URLSearchParams({
      search: ' login & UI ',
      limit: '10',
      offset: '0',
    });

    const response = await GET(createRequest(params), context);

    expect(response.status).toBe(200);

    const [tasksUrl] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(tasksUrl.searchParams.get('title')).toBe('ilike.%login & UI%');

    expect(tasksUrl.toString()).toContain('title=ilike.%25login+%26+UI%25');
  });

  it('returns the exact count for searches with no matches', async () => {
    mockBackend([], '*/0');

    const params = new URLSearchParams({
      search: 'not-existing-task',
      limit: '10',
      offset: '0',
    });

    const response = await GET(createRequest(params), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-range')).toBe('*/0');

    await expect(response.json()).resolves.toEqual([]);
  });

  it('preserves the project access check during searching', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: PROJECT_ID, created_by: OWNER_ID }]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const params = new URLSearchParams({
      search: 'login',
      limit: '10',
      offset: '0',
    });

    const response = await GET(createRequest(params), context);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
