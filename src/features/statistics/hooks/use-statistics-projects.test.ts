import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  effects: [] as (() => void | (() => void))[],
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => hooks.router }));
vi.mock('react', () => ({
  useState(initial: unknown) {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [
      hooks.slots[index],
      (next: unknown) => {
        hooks.slots[index] =
          typeof next === 'function'
            ? (next as (current: unknown) => unknown)(hooks.slots[index])
            : next;
      },
    ];
  },
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]) {
    const index = hooks.index++;
    const previous = hooks.slots[index] as readonly unknown[] | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
      hooks.slots[index] = dependencies;
      hooks.effects.push(effect);
    }
  },
}));
import { useStatisticsProjects } from './use-statistics-projects';

function ProjectsHookHarness() {
  return useStatisticsProjects();
}
function renderProjects() {
  hooks.index = 0;
  return ProjectsHookHarness();
}
function start() {
  return hooks.effects.shift()?.();
}
const project = (index: number) => ({
  id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}`,
  name: `Project ${index}`,
  description: null,
  created_at: '2026-01-01T00:00:00Z',
});
const json = (body: unknown, range = '*/0', status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Range': range } });

describe('statistics project options', () => {
  beforeEach(() => {
    hooks.slots = [];
    hooks.index = 0;
    hooks.effects = [];
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('loads every page, deduplicates IDs, and advances by raw rows', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([1, 2, 3, 4, 5].map(project), '0-4/7'))
      .mockResolvedValueOnce(json([project(5), project(6)], '5-6/7'));
    renderProjects();
    const cleanup = start();
    await vi.waitFor(() => expect(renderProjects().status).toBe('success'));
    expect(renderProjects().projects.map((p) => p.name)).toEqual(
      [1, 2, 3, 4, 5, 6].map((i) => `Project ${i}`),
    );
    expect(vi.mocked(fetch).mock.calls.map((call) => call[0])).toEqual([
      '/api/projects?limit=5&offset=0',
      '/api/projects?limit=5&offset=5',
    ]);
    renderProjects();
    expect(hooks.effects).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(2);
    cleanup?.();
  });

  it('returns a meaningful empty option list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([]));
    renderProjects();
    start();
    await vi.waitFor(() =>
      expect(renderProjects()).toMatchObject({ status: 'success', projects: [] }),
    );
  });

  it.each([json({}, '*/0'), json([project(1)], 'bad'), json([], '*/5'), json([], '*/0', 500)])(
    'rejects malformed, incomplete or failed pages',
    async (response) => {
      vi.mocked(fetch).mockResolvedValueOnce(response);
      renderProjects();
      start();
      await vi.waitFor(() =>
        expect(renderProjects()).toMatchObject({ status: 'error', projects: [] }),
      );
    },
  );

  it('does not expose only the first page when a later page fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([1, 2, 3, 4, 5].map(project), '0-4/6'))
      .mockResolvedValueOnce(json(null, '*/6', 502));
    renderProjects();
    start();
    await vi.waitFor(() =>
      expect(renderProjects()).toMatchObject({ status: 'error', projects: [] }),
    );
  });

  it('redirects an expired session through the existing login flow', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json(null, '*/0', 401));
    renderProjects();
    start();
    await vi.waitFor(() => expect(hooks.router.replace).toHaveBeenCalledWith('/login'));
    expect(hooks.router.refresh).toHaveBeenCalledOnce();
  });

  it('aborts retries and ignores a late old response', async () => {
    let resolveOld!: (response: Response) => void;
    vi.mocked(fetch)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce(json([project(1)], '0-0/1'));
    renderProjects();
    const cleanup = start();
    renderProjects().retry();
    cleanup?.();
    renderProjects();
    start();
    await vi.waitFor(() => expect(renderProjects().status).toBe('success'));
    resolveOld(json(null, '*/0', 401));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderProjects().projects).toHaveLength(1);
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(hooks.router.replace).not.toHaveBeenCalled();
  });
});
