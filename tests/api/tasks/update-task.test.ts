import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectMemberRole } from '@/features/projects/types/project-member';

const auth = vi.hoisted(() => ({ getCookie: vi.fn(), verifyAccessToken: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: auth.getCookie }) }));
vi.mock('@/lib/auth/session', () => ({ verifyAccessToken: auth.verifyAccessToken }));

import { PATCH } from '@/app/api/projects/[projectId]/tasks/[taskId]/route';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const epicId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const otherId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const origin = 'http://localhost:3000';
const context = { params: Promise.resolve({ projectId, taskId }) };
const current = {
  id: taskId,
  project_id: projectId,
  task_id: 'TASK-10',
  title: 'Old title',
  description: 'Old description',
  assignee_id: userId,
  epic_id: epicId,
  due_date: '2026-10-11T00:00:00+00:00',
  status: 'TO_DO',
};

function request(body: unknown = { title: 'New title' }, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function mockAccess({
  role = 'member',
  owner = otherId,
  rows = [current],
}: { role?: ProjectMemberRole | null; owner?: string; rows?: unknown } = {}) {
  const mock = vi
    .fn()
    .mockResolvedValueOnce(json([{ id: projectId, created_by: owner }]))
    .mockResolvedValueOnce(
      json(
        role === null
          ? []
          : [
              {
                member_id: otherId,
                user_id: userId,
                role,
                email: 'user@example.com',
                metadata: { name: 'User' },
              },
            ],
      ),
    )
    .mockResolvedValueOnce(json(rows));
  vi.stubGlobal('fetch', mock);
  return mock;
}

function assertNoWrite() {
  expect(
    vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method === 'PATCH'),
  ).toHaveLength(0);
}

describe('PATCH task details', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'server-only-secret');
    auth.getCookie.mockReturnValue({ value: 'user-token' });
    auth.verifyAccessToken.mockResolvedValue({ id: userId });
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-26T23:59:59.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([
    { projectId: 'invalid', taskId },
    { projectId, taskId: 'TASK-10' },
  ])('rejects invalid route IDs %j', async (params) => {
    expect((await PATCH(request(), { params: Promise.resolve(params) })).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['https://attacker.example', 'null'])('rejects foreign Origin %s', async (Origin) => {
    expect((await PATCH(request(undefined, { Origin }), context)).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a missing Origin', async () => {
    const input = request();
    input.headers.delete('origin');
    expect((await PATCH(input, context)).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['text/plain', ''])('requires JSON content type: %s', async (type) => {
    expect((await PATCH(request(undefined, { 'Content-Type': type }), context)).status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires a session', async () => {
    auth.getCookie.mockReturnValue(undefined);
    expect((await PATCH(request(), context)).status).toBe(401);
    expect(auth.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an expired session', async () => {
    auth.verifyAccessToken.mockResolvedValue(null);
    expect((await PATCH(request(), context)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails safely without server configuration', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect((await PATCH(request(), context)).status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(
    [
      {},
      null,
      [],
      { title: '' },
      { status: 'CUSTOM' },
      { title: 'Valid', project_id: otherId },
      { assignee_id: 'invalid' },
      { epic_id: 'invalid' },
      { due_date: '2026-02-29' },
    ].map((body) => ({ body })),
  )('rejects invalid payload $body before accessing data', async ({ body }) => {
    expect((await PATCH(request(body), context)).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const input = new Request(`${origin}/api`, {
      method: 'PATCH',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: '{',
    });
    expect((await PATCH(input, context)).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each<ProjectMemberRole | null>(['viewer', null])(
    'denies role %s before reading the task',
    async (role) => {
      const mock = mockAccess({ role });
      expect((await PATCH(request(), context)).status).toBe(403);
      expect(mock).toHaveBeenCalledTimes(2);
      assertNoWrite();
    },
  );

  it('explicit Viewer role overrides project creator privileges for every editable field', async () => {
    for (const payload of [
      { title: 'New' },
      { description: null },
      { assignee_id: null },
      { epic_id: null },
      { due_date: null },
      { status: 'DONE' },
    ]) {
      const mock = mockAccess({ role: 'viewer', owner: userId });
      expect((await PATCH(request(payload), context)).status).toBe(403);
      expect(mock).toHaveBeenCalledTimes(2);
      assertNoWrite();
    }
  });

  it.each<ProjectMemberRole | null>(['owner', 'admin', 'member', null])(
    'allows editing with role %s',
    async (role) => {
      const mock = mockAccess({ role, owner: role === null ? userId : otherId });
      mock.mockResolvedValueOnce(json([{ ...current, title: 'New title', private: 'hidden' }]));
      const response = await PATCH(request({ title: '  New title  ' }), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ task: { ...current, title: 'New title' } });
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(auth.verifyAccessToken).toHaveBeenCalledWith('user-token');

      const [url, options] = mock.mock.calls[3] as [URL, RequestInit];
      expect(url.pathname).toBe('/rest/v1/tasks');
      expect(url.searchParams.get('id')).toBe(`eq.${taskId}`);
      expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
      expect(options).toMatchObject({
        method: 'PATCH',
        cache: 'no-store',
        body: '{"title":"New title"}',
      });
      expect(options.headers).toEqual({
        apikey: 'server-only-secret',
        Authorization: 'Bearer user-token',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      });
    },
  );

  it('returns 404 for a missing project', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([]));
    expect((await PATCH(request(), context)).status).toBe(404);
    assertNoWrite();
  });

  it.each(
    [
      [],
      [{ ...current, id: otherId }],
      [{ ...current, project_id: otherId }],
      [current, current],
    ].map((rows) => ({ rows })),
  )('rejects absent, foreign or ambiguous task rows $rows', async ({ rows }) => {
    const mock = mockAccess({ rows });
    expect((await PATCH(request(), context)).status).toBe(rows.length === 0 ? 404 : 502);
    const [url] = mock.mock.calls[2] as [URL];
    expect(url.searchParams.get('id')).toBe(`eq.${taskId}`);
    expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
    assertNoWrite();
  });

  it('uses userId rather than membership record ID for assignment', async () => {
    mockAccess();
    expect((await PATCH(request({ assignee_id: otherId }), context)).status).toBe(400);
    assertNoWrite();
  });

  it('validates a new assignee and epic before updating multiple fields', async () => {
    const mock = mockAccess({ rows: [{ ...current, assignee_id: null, epic_id: null }] });
    mock
      .mockResolvedValueOnce(json([{ id: epicId, project_id: projectId }]))
      .mockResolvedValueOnce(json([{ ...current, title: 'New title' }]));
    const response = await PATCH(
      request({ title: 'New title', assignee_id: userId, epic_id: epicId }),
      context,
    );
    expect(response.status).toBe(200);
    const [epicUrl] = mock.mock.calls[3] as [URL];
    expect(epicUrl.searchParams.get('project_id')).toBe(`eq.${projectId}`);
    expect(epicUrl.searchParams.get('id')).toBe(`eq.${epicId}`);
    expect(JSON.parse(mock.mock.calls[4][1].body)).toEqual({
      title: 'New title',
      assignee_id: userId,
      epic_id: epicId,
    });
  });

  it.each(
    [[], [{ id: epicId, project_id: otherId }], [{ id: otherId, project_id: projectId }]].map(
      (rows) => ({ rows }),
    ),
  )('rejects unavailable or foreign epic $rows', async ({ rows }) => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json(rows));
    expect((await PATCH(request({ epic_id: epicId }), context)).status).toBe(
      rows.length === 0 ? 400 : 502,
    );
    assertNoWrite();
  });

  it('normalizes empty descriptions and clears nullable fields without epic lookup', async () => {
    const mock = mockAccess();
    const cleared = { description: null, assignee_id: null, epic_id: null, due_date: null };
    mock.mockResolvedValueOnce(json([{ ...current, ...cleared }]));
    expect((await PATCH(request({ ...cleared, description: ' \n ' }), context)).status).toBe(200);
    expect(JSON.parse(mock.mock.calls[3][1].body)).toEqual(cleared);
    expect(mock).toHaveBeenCalledTimes(4);
  });

  it.each(['2026-10-26', '2026-10-27'])(
    'stores %s as UTC midnight and accepts equivalent offsets',
    async (date) => {
      const mock = mockAccess();
      mock.mockResolvedValueOnce(json([{ ...current, due_date: `${date}T02:00:00+02:00` }]));
      expect((await PATCH(request({ due_date: date }), context)).status).toBe(200);
      expect(JSON.parse(mock.mock.calls[3][1].body)).toEqual({ due_date: `${date}T00:00:00.000Z` });
    },
  );

  it('rejects a changed past due date before writing any fields', async () => {
    mockAccess();
    expect(
      (await PATCH(request({ title: 'New title', due_date: '2026-10-25' }), context)).status,
    ).toBe(400);
    assertNoWrite();
  });

  it('uses UTC today immediately after midnight', async () => {
    vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
    mockAccess();
    expect((await PATCH(request({ due_date: '2026-10-26' }), context)).status).toBe(400);
    assertNoWrite();
  });

  it('omits an unchanged overdue date while updating another field', async () => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json([{ ...current, title: 'New title' }]));
    expect(
      (await PATCH(request({ title: 'New title', due_date: '2026-10-11' }), context)).status,
    ).toBe(200);
    expect(JSON.parse(mock.mock.calls[3][1].body)).toEqual({ title: 'New title' });
  });

  it('skips normalized unchanged values without a PATCH', async () => {
    const mock = mockAccess();
    const response = await PATCH(
      request({ title: '  Old title ', description: ' Old description ', due_date: '2026-10-11' }),
      context,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ task: current });
    expect(mock).toHaveBeenCalledTimes(3);
    assertNoWrite();
  });

  it('allows unrelated edits on a legacy row with an unknown status', async () => {
    const mock = mockAccess({ rows: [{ ...current, title: null, status: 'CUSTOM' }] });
    mock.mockResolvedValueOnce(
      json([{ ...current, title: null, status: 'CUSTOM', description: null }]),
    );
    expect((await PATCH(request({ description: null }), context)).status).toBe(200);
  });

  it.each([400, 401, 403, 409, 422, 500])(
    'handles backend PATCH failure %s safely',
    async (status) => {
      const mock = mockAccess();
      mock.mockResolvedValueOnce(json({ message: 'private backend error' }, status));
      const response = await PATCH(request(), context);
      expect(response.status).toBe(status === 500 ? 502 : status);
      expect(await response.json()).toEqual({
        message: 'Failed to update task. Please try again.',
      });
    },
  );

  it.each(
    [
      [],
      [current],
      [{ ...current, id: otherId, title: 'New title' }],
      [{ ...current, project_id: otherId, title: 'New title' }],
      [
        { ...current, title: 'New title' },
        { ...current, title: 'New title' },
      ],
      [{ ...current, title: 'New title', due_date: 'invalid' }],
      { task: current },
    ].map((rows) => ({ rows })),
  )('does not confirm empty, mismatched or malformed representation $rows', async ({ rows }) => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json(rows));
    expect((await PATCH(request(), context)).status).toBe(502);
  });

  it('rejects success with an empty non-204 response body', async () => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    expect((await PATCH(request(), context)).status).toBe(502);
  });

  it('confirms a bodyless PATCH using scoped read-back', async () => {
    const mock = mockAccess();
    mock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json([{ ...current, title: 'New title' }]));
    expect((await PATCH(request(), context)).status).toBe(200);
    const [url, options] = mock.mock.calls[4] as [URL, RequestInit];
    expect(url.searchParams.get('id')).toBe(`eq.${taskId}`);
    expect(url.searchParams.get('project_id')).toBe(`eq.${projectId}`);
    expect(options.method).toBe('GET');
  });

  it.each([[], [current]].map((rows) => ({ rows })))(
    'does not confirm a 204 when read-back has not persisted changes: $rows',
    async ({ rows }) => {
      const mock = mockAccess();
      mock
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(json(rows));
      expect((await PATCH(request(), context)).status).toBe(502);
    },
  );

  it('rejects a persisted date with the wrong instant', async () => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json([{ ...current, due_date: '2026-10-26T01:00:00Z' }]));
    expect((await PATCH(request({ due_date: '2026-10-26' }), context)).status).toBe(502);
  });

  it.each([
    { field: 'title', changes: { title: 'New title' } },
    { field: 'description', changes: { description: null } },
    { field: 'assignee_id', changes: { assignee_id: null } },
    { field: 'epic_id', changes: { epic_id: null } },
    { field: 'due_date', changes: { due_date: null } },
    { field: 'status', changes: { status: 'DONE' } },
  ])('confirms only persisted $field changes', async ({ changes }) => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json([{ ...current, ...changes }]));
    expect((await PATCH(request(changes), context)).status).toBe(200);
    expect(JSON.parse(mock.mock.calls[3][1].body)).toEqual(changes);

    const failedMock = mockAccess();
    failedMock.mockResolvedValueOnce(json([current]));
    expect((await PATCH(request(changes), context)).status).toBe(502);
  });

  it('rejects a multi-field response if even one changed field was not persisted', async () => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json([{ ...current, title: 'New title' }]));
    expect((await PATCH(request({ title: 'New title', status: 'DONE' }), context)).status).toBe(
      502,
    );
  });

  it.each([
    { body: { id: projectId }, status: 200 },
    { body: [{ id: otherId, created_by: userId }], status: 200 },
    {
      body: [
        { id: projectId, created_by: userId },
        { id: projectId, created_by: userId },
      ],
      status: 200,
    },
    { body: { message: 'private project error' }, status: 500 },
  ])('fails closed on invalid project response $body', async ({ body, status }) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(body, status));
    const response = await PATCH(request(), context);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain('private');
    assertNoWrite();
  });

  it.each([
    { body: [{ role: 'member' }], status: 200 },
    { body: { message: 'private members error' }, status: 500 },
  ])('fails closed on invalid membership response $body', async ({ body, status }) => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([{ id: projectId, created_by: userId }]))
      .mockResolvedValueOnce(json(body, status));
    expect((await PATCH(request(), context)).status).toBe(502);
    assertNoWrite();
  });

  it('fails closed when the task scope read fails', async () => {
    const mock = mockAccess();
    // Replace the default sequence to fail at the task read.
    mock.mockReset();
    mock
      .mockResolvedValueOnce(json([{ id: projectId, created_by: userId }]))
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json({ message: 'private task error' }, 500));
    expect((await PATCH(request(), context)).status).toBe(502);
    assertNoWrite();
  });

  it.each([
    { body: [{ id: epicId }], status: 200 },
    {
      body: [
        { id: epicId, project_id: projectId },
        { id: epicId, project_id: projectId },
      ],
      status: 200,
    },
    { body: { message: 'private epic error' }, status: 500 },
  ])('fails closed on invalid epic response $body', async ({ body, status }) => {
    const mock = mockAccess();
    mock.mockResolvedValueOnce(json(body, status));
    expect((await PATCH(request({ epic_id: epicId }), context)).status).toBe(502);
    assertNoWrite();
  });

  it('fails safely when 204 read-back fails', async () => {
    const mock = mockAccess();
    mock
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json({ message: 'private read-back error' }, 500));
    expect((await PATCH(request(), context)).status).toBe(502);
  });

  it('handles network failures without leaking internals', async () => {
    const mock = mockAccess();
    mock.mockRejectedValueOnce(new Error('server-only-secret private network failure'));
    const response = await PATCH(request(), context);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toMatch(/server-only-secret|private/);
  });
});
