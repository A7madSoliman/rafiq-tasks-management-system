import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getCookie: vi.fn(), verifyAccessToken: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: auth.getCookie }) }));
vi.mock('@/lib/auth/session', () => ({ verifyAccessToken: auth.verifyAccessToken }));

import { GET } from '@/app/api/projects/[projectId]/epics/[epicId]/tasks/route';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const epicId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const otherId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const task = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  project_id: projectId,
  epic_id: epicId,
  title: 'Design dashboard',
  due_date: '2026-10-15T00:00:00+00:00',
  assignee: { id: userId, name: 'Jane Doe', email: 'private@example.com' },
};
const member = {
  member_id: otherId,
  user_id: userId,
  role: 'viewer',
  email: 'viewer@example.com',
  metadata: { name: 'Jane Doe' },
};
const context = { params: Promise.resolve({ projectId, epicId }) };
const request = () =>
  new Request(`http://localhost:3000/api/projects/${projectId}/epics/${epicId}/tasks`);
const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), { status, headers });

function access({
  owner = otherId,
  members = [member],
  epics = [{ id: epicId, project_id: projectId }],
}: { owner?: string; members?: unknown; epics?: unknown } = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(json([{ id: projectId, created_by: owner }]))
    .mockResolvedValueOnce(json(members))
    .mockResolvedValueOnce(json(epics));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('GET epic tasks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'server-only-secret');
    auth.getCookie.mockReturnValue({ value: 'user-token' });
    auth.verifyAccessToken.mockResolvedValue({ id: userId });
    vi.stubGlobal('fetch', vi.fn());
  });

  it.each([
    { projectId: 'invalid', epicId },
    { projectId, epicId: 'invalid' },
  ])('validates route IDs: %j', async (params) => {
    expect((await GET(request(), { params: Promise.resolve(params) })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires a session', async () => {
    auth.getCookie.mockReturnValue(undefined);
    expect((await GET(request(), context)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('verifies the access token', async () => {
    auth.verifyAccessToken.mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('denies outsiders before fetching epic or task data', async () => {
    const fetchMock = access({ members: [] });
    expect((await GET(request(), context)).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([false, true])('allows viewers and project creators (creator: %s)', async (creator) => {
    const fetchMock = access(creator ? { owner: userId, members: [] } : {});
    fetchMock.mockResolvedValueOnce(json([task], 200, { 'Content-Range': '0-0/1' }));
    const response = await GET(request(), context);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const result: unknown = await response.json();
    expect(result).toEqual([
      { id: task.id, title: task.title, assigneeName: 'Jane Doe', dueDate: task.due_date },
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /private@example|server-only-secret|project_id|epic_id/,
    );
    const [url, options] = fetchMock.mock.calls[3] as [URL, RequestInit];
    expect(url.pathname).toBe('/rest/v1/project_tasks');
    expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
    expect(url.searchParams.get('epic_id')).toBe(`eq.${epicId}`);
    expect(url.searchParams.get('order')).toBe('created_at.asc,id.asc');
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer user-token',
      apikey: 'server-only-secret',
      Prefer: 'count=exact',
    });
    for (const [, init] of fetchMock.mock.calls as [URL, RequestInit][])
      expect(init.cache).toBe('no-store');
  });

  it.each([
    { epics: [] },
    { epics: [{ id: epicId, project_id: otherId }] },
    { epics: [{ id: otherId, project_id: projectId }] },
  ])('checks epic ownership: %j', async ({ epics }) => {
    const fetchMock = access({ epics });
    const response = await GET(request(), context);
    expect(response.status).toBe(epics.length ? 502 : 404);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url] = fetchMock.mock.calls[2] as [URL];
    expect(url.searchParams.get('id')).toBe(`eq.${epicId}`);
    expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
  });

  it('loads every page even when the backend caps the requested page size', async () => {
    const fetchMock = access();
    fetchMock
      .mockResolvedValueOnce(json([task], 206, { 'Content-Range': '0-0/2' }))
      .mockResolvedValueOnce(json([{ ...task, id: otherId }], 206, { 'Content-Range': '1-1/2' }));
    const response = await GET(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveLength(2);
    const urls = fetchMock.mock.calls.slice(3).map(([url]) => url as URL);
    expect(urls.map((url) => url.searchParams.get('offset'))).toEqual(['0', '1']);
  });

  it('returns an empty list', async () => {
    const fetchMock = access();
    fetchMock.mockResolvedValueOnce(json([], 200, { 'Content-Range': '*/0' }));
    expect(await (await GET(request(), context)).json()).toEqual([]);
  });

  it.each([
    { ...task, project_id: otherId },
    { ...task, epic_id: otherId },
    { ...task, assignee: 'invalid' },
    { ...task, assignee: { id: 'invalid', name: null } },
    { ...task, due_date: 'bad-date' },
    { ...task, id: 42 },
  ])('rejects invalid or out-of-scope backend tasks: %j', async (row) => {
    const fetchMock = access();
    fetchMock.mockResolvedValueOnce(json([row], 200, { 'Content-Range': '0-0/1' }));
    expect((await GET(request(), context)).status).toBe(502);
  });

  it('normalizes missing display information without exposing backend data', async () => {
    const fetchMock = access();
    fetchMock.mockResolvedValueOnce(
      json(
        [
          { ...task, title: null, assignee: null, due_date: null },
          { ...task, id: otherId, title: '  ', assignee: { id: userId, name: '  ' } },
        ],
        200,
        { 'Content-Range': '0-1/2' },
      ),
    );
    expect(await (await GET(request(), context)).json()).toEqual([
      { id: task.id, title: 'Untitled task', assigneeName: null, dueDate: null },
      {
        id: otherId,
        title: 'Untitled task',
        assigneeName: 'Unknown assignee',
        dueDate: task.due_date,
      },
    ]);
  });

  it('loads title-only tasks using the actual unassigned backend shape', async () => {
    const fetchMock = access();
    fetchMock.mockResolvedValueOnce(
      json(
        [
          {
            ...task,
            assignee: { id: null, name: null, email: null, department: null },
            due_date: null,
          },
        ],
        200,
        { 'Content-Range': '0-0/1' },
      ),
    );
    const response = await GET(request(), context);
    expect({ status: response.status, body: await response.json() }).toEqual({
      status: 200,
      body: [{ id: task.id, title: task.title, assigneeName: null, dueDate: null }],
    });
  });

  it.each([
    { assignee: null, due_date: null, assigneeName: null },
    { assignee: null, due_date: task.due_date, assigneeName: null },
    { assignee: task.assignee, due_date: null, assigneeName: 'Jane Doe' },
    { assignee: undefined, due_date: undefined, assigneeName: null },
  ])(
    'normalizes nullable or omitted optional fields: %j',
    async ({ assignee, due_date, assigneeName }) => {
      const fetchMock = access();
      fetchMock.mockResolvedValueOnce(
        json([{ ...task, assignee, due_date }], 200, { 'Content-Range': '0-0/1' }),
      );
      const response = await GET(request(), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([
        { id: task.id, title: task.title, assigneeName, dueDate: due_date ?? null },
      ]);
    },
  );

  it.each([false, true])(
    'keeps populated and title-only tasks visible together (paginated: %s)',
    async (paginated) => {
      const fetchMock = access();
      const titleOnly = {
        ...task,
        id: otherId,
        title: 'Title-only task',
        due_date: null,
        assignee: { id: null, name: null, email: null, department: null },
      };
      if (paginated) {
        fetchMock
          .mockResolvedValueOnce(json([task], 206, { 'Content-Range': '0-0/2' }))
          .mockResolvedValueOnce(json([titleOnly], 206, { 'Content-Range': '1-1/2' }));
      } else {
        fetchMock.mockResolvedValueOnce(json([task, titleOnly], 200, { 'Content-Range': '0-1/2' }));
      }
      const response = await GET(request(), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([
        { id: task.id, title: task.title, assigneeName: 'Jane Doe', dueDate: task.due_date },
        { id: otherId, title: titleOnly.title, assigneeName: null, dueDate: null },
      ]);
    },
  );

  it.each([null, '0-0/*', 'bad-range'])(
    'fails instead of silently truncating without an exact count: %s',
    async (range) => {
      const fetchMock = access();
      fetchMock.mockResolvedValueOnce(json([task], 200, range ? { 'Content-Range': range } : {}));
      expect((await GET(request(), context)).status).toBe(502);
    },
  );

  it('rejects a later page that makes no progress', async () => {
    const fetchMock = access();
    fetchMock
      .mockResolvedValueOnce(json([task], 206, { 'Content-Range': '0-0/2' }))
      .mockResolvedValueOnce(json([], 200, { 'Content-Range': '*/2' }));
    expect((await GET(request(), context)).status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it.each([0, 1, 2, 3])('handles upstream failure at request %s', async (failedIndex) => {
    const bodies = [
      [{ id: projectId, created_by: otherId }],
      [member],
      [{ id: epicId, project_id: projectId }],
    ];
    const fetchMock = vi.fn();
    bodies.slice(0, failedIndex).forEach((body) => fetchMock.mockResolvedValueOnce(json(body)));
    fetchMock.mockResolvedValueOnce(json({ message: 'private backend failure' }, 500));
    vi.stubGlobal('fetch', fetchMock);
    const response = await GET(request(), context);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain('private backend failure');
  });
});
