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

import { POST } from '@/app/api/invitations/accept/route';

const ORIGIN = 'http://localhost:3000';
const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function createRequest(
  body: unknown = { token: 'test-invitation-token' },
  headers: Record<string, string> = {},
) {
  return new Request(`${ORIGIN}/api/invitations/accept`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/invitations/accept', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');

    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');

    authMocks.getCookie.mockReturnValue({
      value: 'valid-access-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      email: 'member@example.com',
      name: 'Test Member',
      jobTitle: null,
    });
  });

  it('rejects cross-origin requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      createRequest(undefined, {
        Origin: 'https://evil.example',
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects missing tokens', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await POST(createRequest({ token: '' }));

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid content type', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await POST(
      createRequest(undefined, {
        'Content-Type': 'text/plain',
      }),
    );

    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('requires an active session', async () => {
    authMocks.getCookie.mockReturnValue(undefined);
    vi.stubGlobal('fetch', vi.fn());

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid sessions', async () => {
    authMocks.verifyAccessToken.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn());

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('accepts a 204 response without a project ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest());

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      message: 'Invitation accepted successfully.',
      projectId: null,
    });

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.pathname).toBe('/rest/v1/rpc/accept_invitation');

    expect(options.method).toBe('POST');

    expect(options.headers).toMatchObject({
      apikey: 'test-secret-key',
      Authorization: 'Bearer valid-access-token',
      'Content-Type': 'application/json',
    });

    expect(JSON.parse(options.body as string)).toEqual({
      p_token: 'test-invitation-token',
    });
  });

  it('returns a confirmed project ID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            project_id: PROJECT_ID,
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      message: 'Invitation accepted successfully.',
      projectId: PROJECT_ID,
    });
  });

  it('does not trust an invalid project ID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            project_id: 'invalid',
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      message: 'Invitation accepted successfully.',
      projectId: null,
    });
  });

  it('rejects an explicit backend failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('false', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ),
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(400);
  });

  it('handles an expired invitation response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 410 })));

    const response = await POST(createRequest());

    expect(response.status).toBe(410);
  });

  it('handles unexpected backend errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const response = await POST(createRequest());

    expect(response.status).toBe(502);
  });
});
