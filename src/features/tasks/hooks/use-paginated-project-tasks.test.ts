import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskStatus } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  dependencies: undefined as readonly unknown[] | undefined,
  effects: [] as (() => (() => void) | void)[],
  cleanup: undefined as (() => void) | undefined,
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => hooks.router }));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots))
      hooks.slots[index] = typeof initial === 'function' ? initial() : initial;
    return [
      hooks.slots[index],
      (value: unknown) => {
        hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value;
      },
    ];
  },
  useRef: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useCallback: (callback: unknown, dependencies: readonly unknown[]) => {
    const index = hooks.index++;
    const previous = hooks.slots[index] as
      { callback: unknown; dependencies: readonly unknown[] } | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
      hooks.slots[index] = { callback, dependencies };
      return callback;
    }
    return previous.callback;
  },
  useEffect: (effect: () => (() => void) | void, dependencies: readonly unknown[]) => {
    if (
      !hooks.dependencies ||
      dependencies.some((value, i) => !Object.is(value, hooks.dependencies?.[i]))
    ) {
      hooks.effects.push(effect);
      hooks.dependencies = dependencies;
    }
  },
}));
import { usePaginatedProjectTasks } from './use-paginated-project-tasks';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const task: CreatedTask = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  project_id: projectId,
  task_id: 'TASK-1',
  title: 'Login',
  description: null,
  assignee_id: null,
  epic_id: null,
  due_date: null,
  status: 'TO_DO',
};
function page(tasks: CreatedTask[], count: number, permission: string | null = null) {
  return new Response(JSON.stringify(tasks), {
    headers: {
      'Content-Range': `0-${Math.max(tasks.length - 1, 0)}/${count}`,
      ...(permission === null ? {} : { 'X-Taskly-Can-Edit': permission }),
    },
  });
}
function PaginatedHookHarness(revision: number, status: TaskStatus | null, search: string) {
  return usePaginatedProjectTasks(projectId, status, true, search, revision);
}
function renderQuery(revision = 0, status: TaskStatus | null = 'TO_DO', search = 'login') {
  hooks.index = 0;
  const result = PaginatedHookHarness(revision, status, search);
  for (const effect of hooks.effects.splice(0)) {
    hooks.cleanup?.();
    hooks.cleanup = effect() ?? undefined;
  }
  return result;
}

describe('task pagination invalidation', () => {
  it.each([
    { header: 'true', expected: true },
    { header: 'false', expected: false },
    { header: null, expected: null },
    { header: 'TRUE', expected: null },
    { header: 'invalid', expected: null },
  ])('exposes fail-closed permission metadata for $header', async ({ header, expected }) => {
    vi.mocked(fetch).mockResolvedValueOnce(page([task], 1, header));
    expect(renderQuery().canEdit).toBeNull();
    await vi.waitFor(() =>
      expect(renderQuery()).toMatchObject({ status: 'success', canEdit: expected }),
    );
  });

  it('revokes drag permission when later pagination metadata is missing', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(page([task], 2, 'true'))
      .mockResolvedValueOnce(page([{ ...task, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }], 2));
    renderQuery();
    await vi.waitFor(() => expect(renderQuery().canEdit).toBe(true));
    renderQuery().loadMore();
    await vi.waitFor(() =>
      expect(renderQuery()).toMatchObject({ canEdit: null, isLoadingMore: false }),
    );
    expect(renderQuery().tasks).toHaveLength(2);
  });
  beforeEach(() => {
    hooks.slots = [];
    hooks.index = 0;
    hooks.effects = [];
    hooks.dependencies = undefined;
    hooks.cleanup = undefined;
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    hooks.cleanup?.();
    vi.unstubAllGlobals();
  });

  it('aborts obsolete load-more and restarts offsets/counts with the same status and search', async () => {
    let resolveMore!: (response: Response) => void;
    vi.mocked(fetch)
      .mockResolvedValueOnce(page([task], 2))
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveMore = resolve;
        }),
      )
      .mockResolvedValueOnce(page([], 0));
    renderQuery();
    await vi.waitFor(() => expect(renderQuery().tasks).toEqual([task]));
    renderQuery().loadMore();
    renderQuery().loadMore();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(renderQuery(1)).toMatchObject({ tasks: [], status: 'loading', hasMore: false });
    expect(vi.mocked(fetch).mock.calls[1][1]?.signal?.aborted).toBe(true);
    await vi.waitFor(() =>
      expect(renderQuery(1)).toMatchObject({
        tasks: [],
        totalCount: 0,
        hasMore: false,
        status: 'success',
      }),
    );
    const url = new URL(String(vi.mocked(fetch).mock.calls[2][0]), 'http://localhost');
    expect(url.searchParams.get('offset')).toBe('0');
    expect(url.searchParams.get('status')).toBe('TO_DO');
    expect(url.searchParams.get('search')).toBe('login');
    resolveMore(page([task], 2));
    await Promise.resolve();
    await Promise.resolve();
    expect(renderQuery(1).tasks).toEqual([]);
  });

  it('loads renamed matching tasks on Mobile and replaces old search results without duplicates', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(page([], 0))
      .mockResolvedValueOnce(page([{ ...task, title: 'New login', status: 'DONE' }], 1));
    renderQuery(0, null);
    await vi.waitFor(() => expect(renderQuery(0, null).status).toBe('success'));
    renderQuery(1, null);
    await vi.waitFor(() => expect(renderQuery(1, null).tasks[0]?.title).toBe('New login'));
    expect(renderQuery(1, null).totalCount).toBe(1);
    expect(
      new URL(String(vi.mocked(fetch).mock.calls[1][0]), 'http://localhost').searchParams.has(
        'status',
      ),
    ).toBe(false);
  });

  it('keeps refresh errors retryable without restoring stale cards', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(page([task], 1))
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))
      .mockResolvedValueOnce(page([{ ...task, title: 'Updated login' }], 1));
    renderQuery();
    await vi.waitFor(() => expect(renderQuery().status).toBe('success'));
    renderQuery(1);
    await vi.waitFor(() => expect(renderQuery(1)).toMatchObject({ status: 'error', tasks: [] }));
    renderQuery(1).retry();
    await vi.waitFor(() => expect(renderQuery(1).tasks[0]?.title).toBe('Updated login'));
  });
});
