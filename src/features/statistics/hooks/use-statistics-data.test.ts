import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shiftCalendarDate } from '../utils/statistics-dates';
import type { StatisticsFilters } from '../utils/statistics-filters';

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  effects: [] as (() => void | (() => void))[],
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => harness.router }));
vi.mock('react', () => ({
  useState(initial: unknown) {
    const index = harness.index++;
    if (!(index in harness.slots)) harness.slots[index] = initial;
    return [
      harness.slots[index],
      (next: unknown) => {
        harness.slots[index] =
          typeof next === 'function'
            ? (next as (current: unknown) => unknown)(harness.slots[index])
            : next;
      },
    ];
  },
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]) {
    const index = harness.index++;
    const previous = harness.slots[index] as readonly unknown[] | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
      harness.slots[index] = dependencies;
      harness.effects.push(effect);
    }
  },
}));
import { useStatisticsData } from './use-statistics-data';

const filters: StatisticsFilters = {
  p_start_date: '2026-05-10',
  p_end_date: '2026-05-16',
  p_project_id: null,
  p_status: null,
};
const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const calendar = (start = filters.p_start_date) => ({
  daily: Array.from({ length: 7 }, (_, index) => ({
    day: shiftCalendarDate(start, index),
    statuses: index === 0 ? { TO_DO: 2 } : {},
  })),
  totals: { TO_DO: 2 },
  total_tasks: 2,
  done_tasks: 0,
  overdue_tasks: 5,
});
const projects = [{ project_id: projectId, project_name: 'Taskly', tasks_count: 2 }];
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
function StatisticsDataHookHarness({ value }: { value: StatisticsFilters }) {
  return useStatisticsData(value);
}
function render(value = filters) {
  harness.index = 0;
  return StatisticsDataHookHarness({ value });
}
function startEffects() {
  return harness.effects.splice(0).map((effect) => effect());
}

describe('statistics data loading', () => {
  beforeEach(() => {
    harness.slots = [];
    harness.index = 0;
    harness.effects = [];
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('loads validated calendar and date-only project statistics independently', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(calendar()))
      .mockResolvedValueOnce(response(projects));
    expect(render()).toMatchObject({
      calendar: { status: 'loading' },
      projects: { status: 'loading' },
    });
    startEffects();
    await vi.waitFor(() => expect(render().calendar.status).toBe('success'));
    expect(render().projects).toMatchObject({ status: 'success', data: projects });
    expect(
      vi.mocked(fetch).mock.calls.map(([url, options]) => [url, JSON.parse(String(options?.body))]),
    ).toEqual([
      ['/api/statistics/calendar', filters],
      [
        '/api/statistics/projects',
        { p_start_date: filters.p_start_date, p_end_date: filters.p_end_date },
      ],
    ]);
    expect(render().calendar).toMatchObject({ data: { overdue_tasks: 5 } });
    expect(harness.effects).toHaveLength(0);
  });

  it('refreshes calendar alone for project and status changes and both for a new date range', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(calendar()))
      .mockResolvedValueOnce(response(projects))
      .mockResolvedValueOnce(response(calendar()))
      .mockResolvedValueOnce(response(calendar('2026-05-17')))
      .mockResolvedValueOnce(response(projects));
    render();
    startEffects();
    await vi.waitFor(() => expect(render().calendar.status).toBe('success'));
    const selected = { ...filters, p_project_id: projectId, p_status: 'DONE' as const };
    expect(render(selected).calendar.status).toBe('loading');
    expect(render(selected).projects.status).toBe('success');
    expect(startEffects()).toHaveLength(1);
    await vi.waitFor(() => expect(render(selected).calendar.status).toBe('success'));
    const nextWeek = { ...selected, p_start_date: '2026-05-17', p_end_date: '2026-05-23' };
    expect(render(nextWeek)).toMatchObject({
      calendar: { status: 'loading' },
      projects: { status: 'loading' },
    });
    expect(startEffects()).toHaveLength(2);
    await vi.waitFor(() => expect(render(nextWeek).projects.status).toBe('success'));
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[2][1]?.body))).toMatchObject({
      p_project_id: projectId,
      p_status: 'DONE',
    });
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[4][1]?.body))).toEqual({
      p_start_date: '2026-05-17',
      p_end_date: '2026-05-23',
    });
  });

  it('ignores an aborted older response and rejects malformed current data', async () => {
    let resolveOld!: (response: Response) => void;
    vi.mocked(fetch)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce(response(projects))
      .mockResolvedValueOnce(response(calendar()));
    render();
    const [abortCalendar] = startEffects();
    const selected = { ...filters, p_status: 'DONE' as const };
    render(selected);
    abortCalendar?.();
    startEffects();
    await vi.waitFor(() => expect(render(selected).calendar.status).toBe('success'));
    resolveOld(response(null, 401));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(render(selected).calendar).toMatchObject({ status: 'success' });
    expect(harness.router.replace).not.toHaveBeenCalled();
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
    vi.mocked(fetch).mockResolvedValueOnce(response({ ...calendar(), totals: { BAD: 3 } }));
    const failed = { ...selected, p_status: 'TO_DO' as const };
    render(failed);
    startEffects();
    await vi.waitFor(() => expect(render(failed).calendar.status).toBe('error'));
  });

  it('isolates errors, retries only the failed endpoint, and rejects invalid dates', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(null, 500))
      .mockResolvedValueOnce(response(projects));
    render();
    startEffects();
    await vi.waitFor(() => expect(render().calendar.status).toBe('error'));
    expect(render().projects.status).toBe('success');
    vi.mocked(fetch).mockResolvedValueOnce(response(calendar()));
    const failed = render().calendar;
    if (failed.status !== 'error') throw new Error('Expected failure');
    failed.retry();
    expect(render().calendar.status).toBe('loading');
    expect(startEffects()).toHaveLength(1);
    await vi.waitFor(() => expect(render().calendar.status).toBe('success'));
    expect(fetch).toHaveBeenCalledTimes(3);
    const invalid = { ...filters, p_end_date: '2026-05-18' };
    render(invalid);
    startEffects();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
