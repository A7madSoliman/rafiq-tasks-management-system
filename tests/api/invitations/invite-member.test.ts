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

import { POST } from '@/app/api/projects/[projectId]/invitations/route';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OWNER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const ORIGIN = 'http://localhost:3000';

const context = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};

function createRequest(
  body: unknown = { email: ' user@example.com ' },
  headers: Record<string, string> = {},
): Request {
  return new Request(`${ORIGIN}/api/projects/${PROJECT_ID}/invitations`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function mockProjectAccess(
  role: 'owner' | 'admin' | 'member' | 'viewer' | null,
  rpcStatus = 204,
  creatorId = OWNER_ID,
) {
  const members =
    role === null
      ? []
      : [
          {
            member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            project_id: PROJECT_ID,
            user_id: USER_ID,
            role,
            email: 'member@example.com',
            metadata: {
              name: 'Test Member',
            },
          },
        ];

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: PROJECT_ID,
            created_by: creatorId,
          },
        ]),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(members), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(
      new Response(null, {
        status: rpcStatus,
      }),
    );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('POST /api/projects/[projectId]/invitations', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');

    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');

    vi.stubEnv('APP_URL', 'http://localhost:3000');

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

  it('rejects cross-origin requests', async () => {
    const response = await POST(
      createRequest(undefined, {
        Origin: 'https://other.example',
      }),
      context,
    );

    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid content type', async () => {
    const response = await POST(
      createRequest(undefined, {
        'Content-Type': 'text/plain',
      }),
      context,
    );

    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([{ email: '' }, { email: 'invalid-email' }, { email: '   ' }, {}])(
    'rejects invalid email data: %j',
    async (body) => {
      const response = await POST(createRequest(body), context);

      expect(response.status).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('rejects missing sessions', async () => {
    authMocks.getCookie.mockReturnValue(undefined);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid sessions', async () => {
    authMocks.verifyAccessToken.mockResolvedValue(null);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['owner', 'admin', 'member'] as const)(
    'allows project %s to invite members',
    async (role) => {
      const fetchMock = mockProjectAccess(role);

      const response = await POST(createRequest(), context);

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(3);

      const [rpcUrl, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

      expect(rpcUrl.pathname).toBe('/rest/v1/rpc/invite_member');

      expect(options.method).toBe('POST');

      expect(options.headers).toMatchObject({
        apikey: 'test-secret-key',
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json',
      });

      expect(JSON.parse(options.body as string)).toEqual({
        p_email: 'user@example.com',
        p_project_id: PROJECT_ID,
        p_app_url: ORIGIN,
        p_base_url: 'https://example.supabase.co',
      });
    },
  );

  it('blocks viewers before calling invite_member', async () => {
    const fetchMock = mockProjectAccess('viewer');

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('blocks non-members', async () => {
    const fetchMock = mockProjectAccess(null);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows the project creator without a member record', async () => {
    const fetchMock = mockProjectAccess(null, 204, USER_ID);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('preserves a backend conflict response', async () => {
    mockProjectAccess('member', 409);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(409);

    await expect(response.json()).resolves.toEqual({
      message: 'Unable to send invitation.',
    });
  });

  it('handles an unexpected backend error', async () => {
    mockProjectAccess('member', 500);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(502);
  });

  it('rejects missing application URL configuration', async () => {
    vi.stubEnv('APP_URL', '');

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });
});
