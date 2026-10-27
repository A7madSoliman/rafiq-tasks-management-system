import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getCookie: vi.fn(), verifyAccessToken: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: auth.getCookie })) }));
vi.mock('@/lib/auth/session', () => ({ verifyAccessToken: auth.verifyAccessToken }));

import { POST as calendar } from '@/app/api/statistics/calendar/route';
import { POST as projects } from '@/app/api/statistics/projects/route';

const handlers = { calendar, projects };
type Kind = keyof typeof handlers;
const kinds: Kind[] = ['calendar', 'projects'];
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const dates = { p_start_date: '2026-05-01', p_end_date: '2026-05-07' };
const projectRows = [{ project_id: projectId, project_name: 'Taskly', tasks_count: 3 }];

function calendarData() {
  return {
    daily: Array.from({ length: 7 }, (_, index) => ({
      day: `2026-05-0${index + 1}`,
      statuses: index === 0 ? { TO_DO: 2, DONE: 1 } : {},
    })),
    totals: { TO_DO: 2, DONE: 1 },
    total_tasks: 3,
    done_tasks: 1,
    overdue_tasks: 12, // Independent of the selected range; may exceed total_tasks.
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}
function mockRpc(kind: Kind) {
  return vi
    .mocked(fetch)
    .mockResolvedValueOnce(json(kind === 'calendar' ? calendarData() : projectRows));
}
async function invoke(kind: Kind, body: unknown = dates, headers: Record<string, string> = {}) {
  const response = await handlers[kind](
    new Request(`http://localhost:3000/api/statistics/${kind}`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  return response;
}
function mockAccess(role: string | null, creator = otherId) {
  vi.mocked(fetch)
    .mockResolvedValueOnce(json([{ id: projectId, created_by: creator }]))
    .mockResolvedValueOnce(
      json(
        role
          ? [
              {
                member_id: otherId,
                user_id: userId,
                role,
                email: 'user@example.test',
                metadata: { name: 'User' },
              },
            ]
          : [],
      ),
    );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret');
  vi.stubGlobal('fetch', vi.fn());
  auth.getCookie.mockReturnValue({ value: 'user-token' });
  auth.verifyAccessToken.mockResolvedValue({ id: userId });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe.each(kinds)('POST /api/statistics/%s', (kind) => {
  it('requires a session cookie', async () => {
    auth.getCookie.mockReturnValue(undefined);
    expect((await invoke(kind)).status).toBe(401);
    expect(auth.getCookie).toHaveBeenCalledWith('access_token');
    expect(auth.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid session before making data requests', async () => {
    auth.verifyAccessToken.mockResolvedValue(null);
    expect((await invoke(kind)).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles session verification failure safely', async () => {
    auth.verifyAccessToken.mockRejectedValue(new Error('private backend details'));
    const response = await invoke(kind);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Unable to load statistics.' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['https://outside.test', ''])(
    'rejects cross-origin or missing origin: %s',
    async (origin) => {
      expect((await invoke(kind, dates, { Origin: origin })).status).toBe(403);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('requires JSON content type', async () => {
    expect((await invoke(kind, dates, { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const response = await handlers[kind](
      new Request(`http://localhost:3000/api/statistics/${kind}`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
        body: '{',
      }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { ...dates, p_end_date: '2026-05-08' },
    { ...dates, p_end_date: '2026-04-30' },
    { ...dates, p_start_date: '2026-02-29' },
    { ...dates, p_start_date: '2026-04-31' },
    { p_start_date: '0000-01-01', p_end_date: '0000-01-01' },
    { ...dates, p_start_date: '2026-5-01' },
    { ...dates, p_start_date: '2026-05-01T00:00:00Z' },
    { p_start_date: dates.p_start_date },
    { ...dates, user_id: userId },
    null,
  ])('rejects invalid dates, excessive ranges, or unknown fields: %j', async (body) => {
    expect((await invoke(kind, body)).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the supplied contract and uses only the verified user token', async () => {
    mockRpc(kind);
    const response = await invoke(kind, dates, {
      'Content-Type': 'application/json; charset=utf-8',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(kind === 'calendar' ? calendarData() : projectRows);
    expect(auth.verifyAccessToken).toHaveBeenCalledWith('user-token');
    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(
      `https://example.supabase.co/rest/v1/rpc/${kind === 'calendar' ? 'get_tasks_calendar_stats' : 'get_tasks_count_per_project'}`,
    );
    expect(options).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: 'test-secret',
        Authorization: 'Bearer user-token',
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(options?.body as string)).toEqual(
      kind === 'calendar' ? { ...dates, p_project_id: null, p_status: null } : dates,
    );
  });

  it('accepts a one-day range and empty status/project aggregates', async () => {
    const emptyCalendar = {
      daily: [{ day: dates.p_start_date, statuses: {} }],
      totals: {},
      total_tasks: 0,
      done_tasks: 0,
      overdue_tasks: 2,
    };
    vi.mocked(fetch).mockResolvedValueOnce(json(kind === 'calendar' ? emptyCalendar : []));
    const response = await invoke(kind, { ...dates, p_end_date: dates.p_start_date });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(kind === 'calendar' ? emptyCalendar : []);
  });

  it.each([400, 401, 403, 429, 500])('returns a safe error for backend HTTP %s', async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('private backend details', { status }));
    const response = await invoke(kind);
    expect(response.status).toBe(status === 500 ? 502 : status);
    expect(await response.json()).toEqual({ message: 'Unable to load statistics.' });
  });

  it('handles network failures without exposing backend details', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('private backend details'));
    expect((await invoke(kind)).status).toBe(502);
  });

  it('handles non-JSON success responses as contract incompatibilities', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('not JSON'));
    const response = await invoke(kind);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Invalid statistics response.' });
  });

  it('does not attempt a request with missing server configuration', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    expect((await invoke(kind)).status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('calendar filter and project access checks', () => {
  it.each([{ p_project_id: 'not-a-uuid' }, { p_status: 'ACTIVE' }, { p_status: '' }])(
    'rejects unsupported filters: %j',
    async (filter) => {
      expect((await invoke('calendar', { ...dates, ...filter })).status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each(['owner', 'admin', 'member', 'viewer'])(
    'allows an authorized %s and maps the selected filters',
    async (role) => {
      mockAccess(role);
      mockRpc('calendar');
      const body = { ...dates, p_project_id: projectId, p_status: 'DONE' };
      expect((await invoke('calendar', body)).status).toBe(200);
      const calls = vi.mocked(fetch).mock.calls;
      expect(new URL(String(calls[0][0])).searchParams.get('id')).toBe(`eq.${projectId}`);
      expect(new URL(String(calls[1][0])).searchParams.get('project_id')).toBe(`eq.${projectId}`);
      expect(JSON.parse(calls[2][1]?.body as string)).toEqual(body);
    },
  );

  it('allows the project creator without a membership record', async () => {
    mockAccess(null, userId);
    mockRpc('calendar');
    expect((await invoke('calendar', { ...dates, p_project_id: projectId })).status).toBe(200);
  });

  it('denies outsiders before calling the statistics RPC', async () => {
    mockAccess(null);
    expect((await invoke('calendar', { ...dates, p_project_id: projectId })).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    { rows: [], status: 404 },
    { rows: [{ id: otherId, created_by: userId }], status: 502 },
    {
      rows: [
        { id: projectId, created_by: userId },
        { id: projectId, created_by: userId },
      ],
      status: 502,
    },
  ])('rejects missing or mismatched project scope: %j', async ({ rows, status }) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(rows));
    expect((await invoke('calendar', { ...dates, p_project_id: projectId })).status).toBe(status);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('fails closed on malformed membership data', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([{ id: projectId, created_by: otherId }]))
      .mockResolvedValueOnce(json([{ user_id: userId }]));
    expect((await invoke('calendar', { ...dates, p_project_id: projectId })).status).toBe(502);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not bypass an unsuccessful access check', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect((await invoke('calendar', { ...dates, p_project_id: projectId })).status).toBe(403);
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('RPC response validation', () => {
  it.each([
    { ...calendarData(), daily: null },
    { ...calendarData(), totals: { UNKNOWN: 1 } },
    { ...calendarData(), daily: [{ day: dates.p_start_date, statuses: { ACTIVE: 1 } }] },
    { ...calendarData(), total_tasks: '3' },
    { ...calendarData(), overdue_tasks: -1 },
    { ...calendarData(), done_tasks: 1.5 },
    { ...calendarData(), extra: true },
    { ...calendarData(), daily: Array(7).fill({ day: dates.p_start_date, statuses: {} }) },
    { ...calendarData(), daily: calendarData().daily.slice(1) },
    { ...calendarData(), daily: [{ day: '2026-02-30', statuses: {} }] },
    {
      ...calendarData(),
      daily: [...calendarData().daily.slice(0, 6), { day: '2026-05-08', statuses: {} }],
    },
  ])('rejects a materially incompatible calendar response: %j', async (body) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(body));
    const response = await invoke('calendar');
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: 'Invalid statistics response.' });
  });

  it.each([
    null,
    { projects: projectRows },
    [{ ...projectRows[0], project_id: 'bad-id' }],
    [{ ...projectRows[0], tasks_count: -1 }],
    [{ ...projectRows[0], project_name: null }],
    [{ ...projectRows[0], extra: true }],
  ])('rejects a materially incompatible project response: %j', async (body) => {
    vi.mocked(fetch).mockResolvedValueOnce(json(body));
    expect((await invoke('projects')).status).toBe(502);
  });

  it.each([{ p_status: null }, { p_project_id: null }])(
    'rejects non-date project filters: %j',
    async (filter) => {
      expect((await invoke('projects', { ...dates, ...filter })).status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
