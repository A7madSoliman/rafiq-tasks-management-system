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

import { POST } from '@/app/api/projects/[projectId]/tasks/route';
const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORIGIN = 'http://localhost:3000';

const context = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};

function createRequest(
  headers: Record<string, string> = {},
  bodyOverrides: Record<string, unknown> = {},
): Request {
  return new Request(`${ORIGIN}/api/projects/${PROJECT_ID}/tasks`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      title: 'Create dashboard',
      description: '',
      epicId: '',
      assigneeId: '',
      dueDate: '',
      status: 'TO_DO',
      ...bodyOverrides,
    }),
  });
}

describe('POST /api/projects/[projectId]/tasks - security', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-secret-key');

    vi.stubGlobal('fetch', vi.fn());
  });

  it('rejects requests from another origin', async () => {
    const request = createRequest({
      Origin: 'https://malicious.example',
    });

    const response = await POST(request, context);

    expect(response.status).toBe(403);
    expect(authMocks.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects requests without the correct content type', async () => {
    const request = createRequest({
      'Content-Type': 'text/plain',
    });

    const response = await POST(request, context);

    expect(response.status).toBe(415);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects requests without an active session', async () => {
    authMocks.getCookie.mockReturnValue(undefined);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(401);
    expect(authMocks.verifyAccessToken).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid access token', async () => {
    authMocks.getCookie.mockReturnValue({
      value: 'invalid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue(null);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(401);
    expect(authMocks.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'viewer',
      members: [
        {
          member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          project_id: PROJECT_ID,
          user_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          role: 'viewer',
          email: 'viewer@example.com',
          metadata: { name: 'Viewer' },
        },
      ],
    },
    {
      label: 'non-member',
      members: [],
    },
  ])('rejects a $label before inserting a task', async ({ members }) => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    authMocks.getCookie.mockReturnValue({
      value: 'valid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: userId,
      email: null,
      name: null,
      jobTitle: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: PROJECT_ID,
              created_by: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(members), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest(), context);

    expect(response.status).toBe(403);

    // Only the project and membership GET requests should run.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects an assignee who is not a project member', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const outsideUserId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

    authMocks.getCookie.mockReturnValue({
      value: 'valid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: userId,
      email: null,
      name: null,
      jobTitle: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: PROJECT_ID,
              created_by: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              project_id: PROJECT_ID,
              user_id: userId,
              role: 'member',
              email: 'member@example.com',
              metadata: { name: 'Member' },
            },
          ]),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest({}, { assigneeId: outsideUserId }), context);

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      message: 'Assignee must be a member of this project.',
    });

    // Only project and membership GET requests should execute.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(URL),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects an epic that belongs to another project', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const epicId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

    authMocks.getCookie.mockReturnValue({
      value: 'valid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: userId,
      email: null,
      name: null,
      jobTitle: null,
    });

    const fetchMock = vi
      .fn()
      // 1. Project exists.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: PROJECT_ID,
              created_by: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
          ]),
          { status: 200 },
        ),
      )
      // 2. Current user is a project member.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              project_id: PROJECT_ID,
              user_id: userId,
              role: 'member',
              email: 'member@example.com',
              metadata: { name: 'Member' },
            },
          ]),
          { status: 200 },
        ),
      )
      // 3. Epic is not found in this project.
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest({}, { epicId }), context);

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      message: 'Selected epic does not belong to this project.',
    });

    // Only three GET requests. No task INSERT.
    expect(fetchMock).toHaveBeenCalledTimes(3);

    for (let index = 1; index <= 3; index++) {
      expect(fetchMock).toHaveBeenNthCalledWith(
        index,
        expect.any(URL),
        expect.objectContaining({ method: 'GET' }),
      );
    }
  });

  it('creates a task successfully for an authorized project member', async () => {
    const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const taskId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

    authMocks.getCookie.mockReturnValue({
      value: 'valid-token',
    });

    authMocks.verifyAccessToken.mockResolvedValue({
      id: userId,
      email: null,
      name: null,
      jobTitle: null,
    });

    const createdTask = {
      id: taskId,
      task_id: 'TASK-1',
      project_id: PROJECT_ID,
      title: 'Create dashboard',
      description: null,
      epic_id: null,
      assignee_id: null,
      due_date: '2026-10-15T00:00:00+00:00',
      status: 'TO_DO',
    };

    const fetchMock = vi
      .fn()
      // 1. Project exists.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: PROJECT_ID,
              created_by: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            },
          ]),
          { status: 200 },
        ),
      )
      // 2. Current user is a project member.
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              project_id: PROJECT_ID,
              user_id: userId,
              role: 'member',
              email: 'member@example.com',
              metadata: { name: 'Member' },
            },
          ]),
          { status: 200 },
        ),
      )
      // 3. Supabase creates the task.
      .mockResolvedValueOnce(
        new Response(JSON.stringify([createdTask]), {
          status: 201,
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest({}, { dueDate: '2026-10-15' }), context);

    expect(response.status).toBe(201);

    await expect(response.json()).resolves.toEqual({
      task: createdTask,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Confirm that the third request inserts into the tasks table.
    const [url, options] = fetchMock.mock.calls[2] as [URL, RequestInit];

    expect(url.pathname).toBe('/rest/v1/tasks');
    expect(options.method).toBe('POST');

    expect(JSON.parse(options.body as string)).toEqual({
      project_id: PROJECT_ID,
      title: 'Create dashboard',
      description: null,
      epic_id: null,
      assignee_id: null,
      due_date: '2026-10-15T00:00:00.000Z',
      status: 'TO_DO',
    });
  });

  it.each([
    { supabaseStatus: 409, expectedStatus: 409 },
    { supabaseStatus: 500, expectedStatus: 502 },
  ])(
    'handles Supabase INSERT failure with status $supabaseStatus',
    async ({ supabaseStatus, expectedStatus }) => {
      const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

      authMocks.getCookie.mockReturnValue({
        value: 'valid-token',
      });

      authMocks.verifyAccessToken.mockResolvedValue({
        id: userId,
        email: null,
        name: null,
        jobTitle: null,
      });

      const fetchMock = vi
        .fn()
        // 1. Project verification succeeds.
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                id: PROJECT_ID,
                created_by: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              },
            ]),
            { status: 200 },
          ),
        )
        // 2. User has permission to create tasks.
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                member_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                project_id: PROJECT_ID,
                user_id: userId,
                role: 'member',
                email: 'member@example.com',
                metadata: { name: 'Member' },
              },
            ]),
            { status: 200 },
          ),
        )
        // 3. Supabase INSERT fails.
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              message: 'Internal database error details',
            }),
            { status: supabaseStatus },
          ),
        );

      vi.stubGlobal('fetch', fetchMock);

      const response = await POST(createRequest(), context);

      expect(response.status).toBe(expectedStatus);

      await expect(response.json()).resolves.toEqual({
        message: 'Unable to create task.',
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);

      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        expect.any(URL),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    },
  );
});
