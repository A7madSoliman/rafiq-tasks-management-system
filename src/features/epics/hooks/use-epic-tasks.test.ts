import { beforeEach, describe, expect, it, vi } from 'vitest';

// Exercise the effect lifecycle without adding a DOM or React test dependency.
const hooks = vi.hoisted(() => ({
  states: [] as unknown[],
  index: 0,
  effects: [] as (() => (() => void) | void)[],
  dependencies: undefined as readonly unknown[] | undefined,
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => hooks.router }));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.states)) hooks.states[index] = initial;
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

import { useEpicTasks } from './use-epic-tasks';

const task = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: 'Task A',
  assigneeName: null,
  dueDate: null,
};
const dataResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
function HookHarness(projectId = 'project', epicId = 'epic-a', revision = 0) {
  hooks.index = 0;
  return useEpicTasks(projectId, epicId, revision);
}
function startEffect() {
  return hooks.effects.pop()?.();
}

describe('epic tasks requests', () => {
  it('refreshes task changes/removals by revision and ignores a late previous list', async () => {
    let resolveOld!: (body: unknown) => void;
    const oldBody = new Promise<unknown>((resolve) => {
      resolveOld = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => oldBody } as Response)
        .mockResolvedValueOnce(
          dataResponse([
            { ...task, title: 'Updated', assigneeName: 'Jane', dueDate: '2099-01-01T00:00:00Z' },
          ]),
        )
        .mockResolvedValueOnce(dataResponse([])),
    );
    HookHarness();
    const cleanup = startEffect();
    await Promise.resolve();
    cleanup?.();
    HookHarness('project', 'epic-a', 1);
    startEffect();
    await vi.waitFor(() =>
      expect(HookHarness('project', 'epic-a', 1).tasks[0]).toMatchObject({
        title: 'Updated',
        assigneeName: 'Jane',
      }),
    );
    resolveOld([task]);
    await oldBody;
    await Promise.resolve();
    expect(HookHarness('project', 'epic-a', 1).tasks[0]?.title).toBe('Updated');
    expect(HookHarness('project', 'epic-a', 2)).toMatchObject({ status: 'loading', tasks: [] });
    startEffect();
    await vi.waitFor(() =>
      expect(HookHarness('project', 'epic-a', 2)).toMatchObject({ status: 'success', tasks: [] }),
    );
  });
  beforeEach(() => {
    hooks.states = [];
    hooks.effects = [];
    hooks.dependencies = undefined;
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('loads normalized tasks without caching', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(dataResponse([task]));
    expect(HookHarness().status).toBe('loading');
    startEffect();
    await vi.waitFor(() => expect(HookHarness().tasks).toEqual([task]));
    expect(fetch).toHaveBeenCalledWith(
      '/api/projects/project/epics/epic-a/tasks',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
  });

  it.each([dataResponse({}, 500), dataResponse([{ ...task, id: 42 }])])(
    'handles failed or malformed responses and retries',
    async (response) => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce(dataResponse([task]));
      HookHarness();
      const cleanup = startEffect();
      await vi.waitFor(() => expect(HookHarness().status).toBe('error'));
      HookHarness().retry();
      cleanup?.();
      HookHarness();
      startEffect();
      await vi.waitFor(() => expect(HookHarness().tasks).toEqual([task]));
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('hides old tasks immediately when switching epics or projects', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(dataResponse([task]));
    HookHarness();
    const cleanup = startEffect();
    await vi.waitFor(() => expect(HookHarness().status).toBe('success'));
    expect(HookHarness('project', 'epic-b')).toMatchObject({ tasks: [], status: 'loading' });
    expect(HookHarness('other-project', 'epic-a')).toMatchObject({ tasks: [], status: 'loading' });
    cleanup?.();
  });

  it('aborts on cleanup and ignores a late body from the previous epic', async () => {
    let resolveBody!: (body: unknown) => void;
    const body = new Promise<unknown>((resolve) => {
      resolveBody = resolve;
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => body } as Response)
      .mockResolvedValueOnce(dataResponse([{ ...task, title: 'Task B' }]));
    HookHarness();
    const cleanup = startEffect();
    await Promise.resolve();
    cleanup?.();
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
    HookHarness('project', 'epic-b');
    startEffect();
    await vi.waitFor(() => expect(HookHarness('project', 'epic-b').tasks[0]?.title).toBe('Task B'));
    resolveBody([task]);
    await body;
    await Promise.resolve();
    expect(HookHarness('project', 'epic-b').tasks[0]?.title).toBe('Task B');
  });

  it('ignores a late request failure after unmount', async () => {
    let rejectRequest!: (error: Error) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectRequest = reject;
      }),
    );
    HookHarness();
    const cleanup = startEffect();
    cleanup?.();
    rejectRequest(new Error('aborted'));
    await Promise.resolve();
    expect(HookHarness().status).toBe('loading');
  });

  it('redirects an expired session to login', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(dataResponse({}, 401));
    HookHarness();
    startEffect();
    await vi.waitFor(() => expect(hooks.router.replace).toHaveBeenCalledWith('/login'));
    expect(hooks.router.refresh).toHaveBeenCalledOnce();
  });
});
