import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  states: [] as unknown[],
  index: 0,
  effects: [] as (() => (() => void) | void)[],
  dependencies: undefined as readonly unknown[] | undefined,
  router: {
    replace: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => hooks.router,
}));

vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.index++;

    if (!(index in hooks.states)) {
      hooks.states[index] = initial;
    }

    return [
      hooks.states[index],
      (value: unknown) => {
        hooks.states[index] =
          typeof value === 'function'
            ? (value as (current: unknown) => unknown)(hooks.states[index])
            : value;
      },
    ];
  },

  useEffect: (effect: () => (() => void) | void, dependencies: readonly unknown[]) => {
    if (
      !hooks.dependencies ||
      dependencies.some((value, index) => !Object.is(value, hooks.dependencies?.[index]))
    ) {
      hooks.effects.push(effect);
      hooks.dependencies = dependencies;
    }
  },
}));

import { useTaskDetails } from './use-task-details';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const taskId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const otherTaskId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const task = {
  id: taskId,
  projectId,
  taskCode: 'TASK-10',
  title: 'Implement login',
  description: null,
  status: 'REOPENED',
  epic: null,
  assigneeName: null,
  createdByName: null,
  dueDate: null,
  createdAt: null,
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function TaskDetailsHookHarness(currentProjectId = projectId, currentTaskId = taskId) {
  hooks.index = 0;
  return useTaskDetails(currentProjectId, currentTaskId);
}

function runEffect() {
  return hooks.effects.pop()?.();
}

describe('useTaskDetails', () => {
  beforeEach(() => {
    hooks.states = [];
    hooks.effects = [];
    hooks.dependencies = undefined;

    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('loads one task through the Next.js API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(task));

    expect(TaskDetailsHookHarness().status).toBe('loading');

    runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness()).toMatchObject({
        status: 'success',
        task,
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      `/api/projects/${projectId}/tasks/${taskId}`,
      expect.objectContaining({
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('handles a missing task', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 404));

    TaskDetailsHookHarness();
    runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('not-found');
    });
  });

  it('handles a failed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 500));

    TaskDetailsHookHarness();
    runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('error');
    });
  });

  it('rejects invalid response data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ ...task, title: 42 }));

    TaskDetailsHookHarness();
    runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('error');
    });
  });

  it('allows retrying a failed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 500)).mockResolvedValueOnce(response(task));

    TaskDetailsHookHarness();
    const cleanup = runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('error');
    });

    TaskDetailsHookHarness().retry();
    cleanup?.();

    TaskDetailsHookHarness();
    runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('success');
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('hides previous task details immediately', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(task));

    TaskDetailsHookHarness();
    const cleanup = runEffect();

    await vi.waitFor(() => {
      expect(TaskDetailsHookHarness().status).toBe('success');
    });

    expect(TaskDetailsHookHarness(projectId, otherTaskId)).toMatchObject({
      status: 'loading',
      task: null,
    });

    cleanup?.();
  });

  it('aborts pending requests when closing', async () => {
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>(() => {}));

    TaskDetailsHookHarness();
    const cleanup = runEffect();

    expect(fetch).toHaveBeenCalledOnce();

    cleanup?.();

    const options = vi.mocked(fetch).mock.calls[0][1];

    expect(options?.signal?.aborted).toBe(true);
  });

  it('redirects to login for expired sessions', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 401));

    TaskDetailsHookHarness();
    runEffect();

    await vi.waitFor(() => {
      expect(hooks.router.replace).toHaveBeenCalledWith('/login');
    });

    expect(hooks.router.refresh).toHaveBeenCalledOnce();
  });
});
