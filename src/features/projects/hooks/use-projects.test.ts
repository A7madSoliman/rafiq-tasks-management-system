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
  useRef(initial: unknown) {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  },
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => {
    hooks.effects.push(effect);
  },
}));
import { useProjects } from './use-projects';

function ProjectsHookHarness(page: number) {
  return useProjects(page);
}
function renderProjects(page = 1) {
  hooks.index = 0;
  return ProjectsHookHarness(page);
}
const project = (id: string | number, name = `Project ${id}`) => ({
  id,
  name,
  description: null,
  created_at: '2026-01-01T00:00:00Z',
});
const json = (body: unknown, range: string, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Range': range } });
async function loadInitial(page = 1) {
  renderProjects(page);
  hooks.effects.pop()?.();
  await vi.waitFor(() => expect(renderProjects(page).status).toBe('success'));
  return renderProjects(page);
}
const ids = (page = 1) => renderProjects(page).projects.map((p) => p.id);

describe('projects pagination with duplicate API rows', () => {
  beforeEach(() => {
    hooks.slots = [];
    hooks.effects = [];
    hooks.index = 0;
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the first occurrence and response order after ID normalization on initial load', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json(
        [project(2, 'First'), project('1'), project('2', 'Duplicate'), project('3'), project('1')],
        '0-4/5',
      ),
    );
    const result = await loadInitial();
    expect(ids()).toEqual(['2', '1', '3']);
    expect(result.projects[0].name).toBe('First');
    expect(result).toMatchObject({ totalCount: 5, hasMore: false });
  });

  it('deduplicates both page overlap and repeated new IDs while keeping the first version', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([project('a'), project('b')], '0-1/7'))
      .mockResolvedValueOnce(
        json(
          [
            project('b', 'Changed'),
            project('c', 'First C'),
            project('c', 'Duplicate C'),
            project('d'),
            project('a'),
          ],
          '2-6/7',
        ),
      );
    await loadInitial();
    await renderProjects().loadMore();
    expect(ids()).toEqual(['a', 'b', 'c', 'd']);
    expect(renderProjects().projects.map((p) => p.name)).toEqual([
      'Project a',
      'Project b',
      'First C',
      'Project d',
    ]);
    expect(renderProjects()).toMatchObject({ totalCount: 7, hasMore: false });
  });

  it('advances by raw rows on initial and duplicate-only subsequent pages until the server total', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        json([project('a'), project('a'), project('b'), project('b'), project('a')], '0-4/12'),
      )
      .mockResolvedValueOnce(
        json(
          Array.from({ length: 5 }, () => project('a')),
          '5-9/12',
        ),
      )
      .mockResolvedValueOnce(json([project('c'), project('c')], '10-11/12'));
    await loadInitial();
    expect(renderProjects().hasMore).toBe(true);
    await renderProjects().loadMore();
    expect(ids()).toEqual(['a', 'b']);
    expect(renderProjects().hasMore).toBe(true);
    await renderProjects().loadMore();
    expect(ids()).toEqual(['a', 'b', 'c']);
    expect(renderProjects()).toMatchObject({ totalCount: 12, hasMore: false });
    await renderProjects().loadMore();
    expect(vi.mocked(fetch).mock.calls.map((call) => call[0])).toEqual([
      '/api/projects?limit=5&offset=0',
      '/api/projects?limit=5&offset=5',
      '/api/projects?limit=5&offset=10',
    ]);
  });

  it('preserves numbered-page offsets and server totals', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([project('b'), project('b'), project('c')], '5-7/10'))
      .mockResolvedValueOnce(json([project('c'), project('d')], '8-9/10'));
    await loadInitial(2);
    await renderProjects(2).loadMore();
    expect(ids(2)).toEqual(['b', 'c', 'd']);
    expect(renderProjects(2)).toMatchObject({ totalCount: 10, hasMore: false });
    expect(vi.mocked(fetch).mock.calls.map((call) => call[0])).toEqual([
      '/api/projects?limit=5&offset=5',
      '/api/projects?limit=5&offset=8',
    ]);
  });

  it('keeps offsets and projects on failure and deduplicates the retried page', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(json([project('a')], '0-0/3'))
      .mockResolvedValueOnce(json(null, '*/3', 500))
      .mockResolvedValueOnce(json([project('b'), project('b')], '1-2/3'));
    await loadInitial();
    await renderProjects().loadMore();
    expect(ids()).toEqual(['a']);
    expect(renderProjects()).toMatchObject({ loadMoreError: true, hasMore: true, totalCount: 3 });
    await renderProjects().loadMore();
    expect(ids()).toEqual(['a', 'b']);
    expect(renderProjects()).toMatchObject({ loadMoreError: false, hasMore: false, totalCount: 3 });
    expect(
      vi
        .mocked(fetch)
        .mock.calls.slice(1)
        .map((call) => call[0]),
    ).toEqual(['/api/projects?limit=5&offset=1', '/api/projects?limit=5&offset=1']);
  });

  it('does not bypass validation for an invalid duplicate row', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([project('a'), { id: 'a' }], '0-1/2'));
    renderProjects();
    hooks.effects.pop()?.();
    await vi.waitFor(() => expect(renderProjects().status).toBe('error'));
    expect(ids()).toEqual([]);
  });

  it('preserves the empty response behavior', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json([], '*/0'));
    expect(await loadInitial()).toMatchObject({ projects: [], totalCount: 0, hasMore: false });
  });
});
