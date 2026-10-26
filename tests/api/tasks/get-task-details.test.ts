import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  getCookie: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: auth.getCookie }),
}));

vi.mock('@/lib/auth/session', () => ({
  verifyAccessToken: auth.verifyAccessToken,
}));

import { GET } from '@/app/api/projects/[projectId]/tasks/[taskId]/route';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const epicId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ownerId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const member = {
  member_id: userId,
  user_id: userId,
  role: 'viewer',
  email: 'member@example.com',
  metadata: { name: 'Jane Doe' },
};

const task = {
  id: taskId,
  project_id: projectId,
  epic_id: epicId,
  task_id: 'TASK-10',
  title: 'Implement login',
  description: 'Create login UI',
  status: 'REOPENED',
  created_at: '2026-10-11T16:22:57.465586+00:00',
  due_date: '2026-10-11T00:00:00+00:00',
  epic: {
    id: epicId,
    epic_id: 'EPIC-20',
    title: 'Authentication',
  },
  created_by: {
    id: ownerId,
    name: 'Task Creator',
    email: 'private@example.com',
    department: 'Frontend',
  },
  assignee: {
    id: userId,
    name: 'Jane Doe',
    email: 'assignee@example.com',
    department: 'Frontend',
  },
};

const context = {
  params: Promise.resolve({ projectId, taskId }),
};

const request = () =>
  new Request(`http://localhost:3000/api/projects/${projectId}/tasks/${taskId}`);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function mockProjectAccess({
  owner = ownerId,
  members = [member],
}: {
  owner?: string;
  members?: unknown;
} = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(json([{ id: projectId, created_by: owner }]))
    .mockResolvedValueOnce(json(members));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('GET task details', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'server-only-secret');

    auth.getCookie.mockReturnValue({ value: 'user-token' });
    auth.verifyAccessToken.mockResolvedValue({ id: userId });

    vi.stubGlobal('fetch', vi.fn());
  });

  it.each([
    { projectId: 'invalid', taskId },
    { projectId, taskId: 'TASK-10' },
  ])('rejects invalid IDs', async (params) => {
    const response = await GET(request(), {
      params: Promise.resolve(params),
    });

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires an active session', async () => {
    auth.getCookie.mockReturnValue(undefined);

    const response = await GET(request(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    auth.verifyAccessToken.mockResolvedValue(null);

    const response = await GET(request(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 404 when the project does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([])));

    const response = await GET(request(), context);

    expect(response.status).toBe(404);
  });

  it('denies users outside the project', async () => {
    const fetchMock = mockProjectAccess({ members: [] });

    const response = await GET(request(), context);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])('allows project members and owners (owner: %s)', async (asOwner) => {
    const fetchMock = mockProjectAccess(asOwner ? { owner: userId, members: [] } : {});

    fetchMock.mockResolvedValueOnce(json([task]));

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');

    expect(await response.json()).toEqual({
      id: taskId,
      projectId,
      taskCode: 'TASK-10',
      title: 'Implement login',
      description: 'Create login UI',
      status: 'REOPENED',
      epic: {
        id: epicId,
        code: 'EPIC-20',
        title: 'Authentication',
      },
      assigneeName: 'Jane Doe',
      assigneeId: userId,
      canEdit: asOwner,
      createdByName: 'Task Creator',
      dueDate: task.due_date,
      createdAt: task.created_at,
    });

    const [url, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(url.pathname).toBe('/rest/v1/project_tasks');
    expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
    expect(url.searchParams.get('id')).toBe(`eq.${taskId}`);
    expect(url.searchParams.get('limit')).toBe('2');

    expect(options.cache).toBe('no-store');
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer user-token',
      apikey: 'server-only-secret',
    });
  });

  it('does not expose private user fields or server secrets', async () => {
    const fetchMock = mockProjectAccess();
    fetchMock.mockResolvedValueOnce(json([task]));

    const response = await GET(request(), context);
    const body = JSON.stringify(await response.json());

    expect(body).not.toMatch(/private@example|assignee@example|server-only-secret|department/);
  });

  it.each(['owner', 'admin', 'member', 'viewer'])(
    'reports editing permission for role %s while preserving read access',
    async (role) => {
      const fetchMock = mockProjectAccess({ members: [{ ...member, role }] });
      fetchMock.mockResolvedValueOnce(json([task]));
      const response = await GET(request(), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        assigneeId: userId,
        canEdit: role !== 'viewer',
      });
    },
  );

  it('keeps a creator with an explicit Viewer role read-only', async () => {
    const fetchMock = mockProjectAccess({ owner: userId });
    fetchMock.mockResolvedValueOnce(json([task]));
    const response = await GET(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ canEdit: false });
  });

  it('returns 404 when the task is not found', async () => {
    const fetchMock = mockProjectAccess();
    fetchMock.mockResolvedValueOnce(json([]));

    const response = await GET(request(), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Task not found.',
    });
  });

  it('handles missing optional fields', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(
      json([
        {
          ...task,
          epic_id: null,
          epic: null,
          task_id: null,
          title: null,
          description: null,
          due_date: null,
          created_at: null,
          assignee: {
            id: null,
            name: null,
            email: null,
            department: null,
          },
          created_by: null,
        },
      ]),
    );

    const response = await GET(request(), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      taskCode: null,
      title: 'Untitled task',
      description: null,
      epic: null,
      assigneeName: null,
      assigneeId: null,
      canEdit: false,
      createdByName: null,
      dueDate: null,
      createdAt: null,
    });
  });

  it('preserves an unknown status for UI fallback', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(json([{ ...task, status: 'CUSTOM_STATUS' }]));

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'CUSTOM_STATUS',
    });
  });

  it.each([
    { ...task, id: ownerId },
    { ...task, project_id: ownerId },
    {
      ...task,
      epic: { ...task.epic, id: ownerId },
    },
    { ...task, due_date: 'invalid-date' },
    { ...task, assignee: 'invalid' },
  ])('rejects invalid backend task data', async (row) => {
    const fetchMock = mockProjectAccess();
    fetchMock.mockResolvedValueOnce(json([row]));

    const response = await GET(request(), context);

    expect(response.status).toBe(502);
  });

  it('rejects multiple returned tasks', async () => {
    const fetchMock = mockProjectAccess();
    fetchMock.mockResolvedValueOnce(json([task, task]));

    const response = await GET(request(), context);

    expect(response.status).toBe(502);
  });

  it('handles backend failure without leaking details', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockResolvedValueOnce(json({ message: 'private backend error' }, 500));

    const response = await GET(request(), context);
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(body).not.toContain('private backend error');
  });

  it('handles network failures', async () => {
    const fetchMock = mockProjectAccess();

    fetchMock.mockRejectedValueOnce(new Error('Private network details'));

    const response = await GET(request(), context);

    expect(response.status).toBe(502);
  });
});
