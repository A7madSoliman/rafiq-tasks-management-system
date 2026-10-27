import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type ComponentProps,
  type ChangeEvent,
  type MouseEvent,
  type KeyboardEvent,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { TASK_STATUSES } from '@/features/tasks/constants/task-statuses';
import { initialStatisticsFilters } from '../utils/statistics-filters';
import { StatisticsDateRange, RangeCalendar } from './statistics-date-range';
import { StatisticsFiltersToolbar } from './statistics-filters-toolbar';
import { MyStatisticsScreen, StatisticsContent } from './my-statistics-screen';
import {
  StatisticsHeaderSkeleton,
  StatisticsInitialLoadingState,
} from './statistics-loading-state';

const state = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  effects: [] as (() => void)[],
  status: 'success' as 'loading' | 'success' | 'error',
  calendarStatus: 'loading' as 'loading' | 'success' | 'error',
  projectsStatus: 'loading' as 'loading' | 'success' | 'error',
  retry: vi.fn(),
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState(initial: unknown) {
    const index = state.index++;
    if (!(index in state.slots)) state.slots[index] = initial;
    return [
      state.slots[index],
      (value: unknown) => {
        state.slots[index] =
          typeof value === 'function'
            ? (value as (current: unknown) => unknown)(state.slots[index])
            : value;
      },
    ];
  },
  useRef(initial: unknown) {
    const index = state.index++;
    if (!(index in state.slots)) state.slots[index] = { current: initial };
    return state.slots[index];
  },
  useId: () => 'statistics-range',
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void) => {
    state.effects.push(effect);
  },
}));
vi.mock('../hooks/use-statistics-projects', () => ({
  useStatisticsProjects: () => ({
    status: state.status,
    retry: state.retry,
    projects:
      state.status === 'success'
        ? [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Taskly' }]
        : [],
  }),
}));
vi.mock('../hooks/use-statistics-data', () => ({
  useStatisticsData: () => ({
    calendar: { status: state.calendarStatus },
    projects: { status: state.projectsStatus },
  }),
}));
vi.mock('@/assets/icons/statistics/range-previous.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/range-next.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/month-previous.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/month-next.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/mobile-calendar.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/select-chevron.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/mobile-status-chevron.svg', () => ({ default: () => null }));

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement<Record<string, unknown>>(child))
      result.push(child, ...elements(child.props.children as ReactNode));
  });
  return result;
}
function find(
  tree: ReactNode,
  predicate: (element: ReactElement<Record<string, unknown>>) => boolean,
) {
  const element = elements(tree).find(predicate);
  if (!element) throw new Error('Missing expected control');
  return element;
}
function click(tree: ReactNode, label: string) {
  const control = find(
    tree,
    (element) =>
      (element.type === 'button' && element.props['aria-label'] === label) ||
      element.props.children === label,
  );
  (control.props as ComponentProps<'button'>).onClick?.({} as MouseEvent<HTMLButtonElement>);
}
const range = { p_start_date: '2026-05-11', p_end_date: '2026-05-17' };
const onApply = vi.fn();
const onClose = vi.fn();
function calendar() {
  state.index = 0;
  return RangeCalendar({
    id: 'calendar',
    value: range,
    anchorRef: { current: null },
    onApply,
    onClose,
  });
}
function choose(tree: ReactNode, day: string) {
  const control = find(tree, (element) => element.props['data-day'] === day);
  (control.props as ComponentProps<'button'>).onClick?.({} as MouseEvent<HTMLButtonElement>);
}
function applyControl(tree: ReactNode) {
  return find(tree, (element) => element.props.children === 'Apply Range');
}

beforeEach(() => {
  state.slots = [];
  state.index = 0;
  state.effects = [];
  state.status = 'success';
  state.calendarStatus = 'loading';
  state.projectsStatus = 'loading';
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('statistics filter controls', () => {
  it('maps project/status options and their All selections to the validated typed model', () => {
    let filters = initialStatisticsFilters(new Date(2026, 4, 13, 12));
    const render = () =>
      StatisticsFiltersToolbar({
        filters,
        onChange: (next) => {
          filters = next;
        },
      });
    const change = (label: string, value: string) => {
      const select = find(
        render(),
        (element) => element.type === 'select' && element.props['aria-label'] === label,
      );
      (select.props as ComponentProps<'select'>).onChange?.({
        target: { value },
      } as ChangeEvent<HTMLSelectElement>);
    };
    change('Project', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    change('Status', 'DONE');
    expect(filters.p_project_id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(filters.p_status).toBe('DONE');
    change('Status', 'ACTIVE');
    expect(filters.p_status).toBe('DONE');
    change('Project', '');
    change('Status', '');
    expect(filters).toMatchObject({ p_project_id: null, p_status: null });
    expect(
      elements(render())
        .filter((element) => element.type === 'option')
        .map((element) => element.props.value),
    ).toEqual([
      '',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '',
      ...TASK_STATUSES.map((status) => status.value),
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['loading', 'error'] as const)(
    'shows %s project feedback without applying partial options',
    (status) => {
      state.status = status;
      const tree = StatisticsFiltersToolbar({
        filters: initialStatisticsFilters(),
        onChange: vi.fn(),
      });
      const html = renderToStaticMarkup(tree);
      if (status === 'loading') {
        expect(html).toContain('aria-label="Loading project options"');
        expect(html).toContain('motion-reduce:animate-none');
        expect(html).not.toContain('Loading projects...');
        expect(
          elements(tree).some(
            (element) => element.type === 'select' && element.props['aria-label'] === 'Project',
          ),
        ).toBe(false);
      } else {
        const select = find(
          tree,
          (element) => element.type === 'select' && element.props['aria-label'] === 'Project',
        );
        expect(select.props.disabled).toBe(true);
        expect(html).toContain('Unable to load projects.');
        click(tree, 'Retry');
        expect(state.retry).toHaveBeenCalledOnce();
      }
    },
  );

  it('shifts applied dates using the previous and next controls', () => {
    const onChange = vi.fn();
    state.index = 0;
    const tree = StatisticsDateRange({ value: range, onChange });
    click(tree, 'Previous week');
    expect(onChange).toHaveBeenLastCalledWith({
      p_start_date: '2026-05-04',
      p_end_date: '2026-05-10',
    });
    click(tree, 'Next week');
    expect(onChange).toHaveBeenLastCalledWith({
      p_start_date: '2026-05-18',
      p_end_date: '2026-05-24',
    });
  });

  it('holds draft dates, rejects a long range, and applies only a valid range', () => {
    choose(calendar(), '2026-05-12');
    expect(applyControl(calendar()).props.disabled).toBe(true);
    expect(onApply).not.toHaveBeenCalled();
    choose(calendar(), '2026-05-20');
    expect(applyControl(calendar()).props.disabled).toBe(true);
    expect(elements(calendar()).some((element) => element.props.role === 'alert')).toBe(true);
    choose(calendar(), '2026-05-13');
    choose(calendar(), '2026-05-17');
    expect(applyControl(calendar()).props.disabled).toBe(false);
    (applyControl(calendar()).props as ComponentProps<'button'>).onClick?.(
      {} as MouseEvent<HTMLButtonElement>,
    );
    expect(onApply).toHaveBeenCalledExactlyOnceWith({
      p_start_date: '2026-05-13',
      p_end_date: '2026-05-17',
    });
    expect(range).toEqual({ p_start_date: '2026-05-11', p_end_date: '2026-05-17' });
  });

  it('discards drafts on Cancel and Escape without applying', () => {
    choose(calendar(), '2026-05-12');
    click(calendar(), 'Cancel');
    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    (calendar().props as ComponentProps<'div'>).onKeyDown?.({
      key: 'Escape',
      preventDefault,
      stopPropagation,
    } as unknown as KeyboardEvent<HTMLDivElement>);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('supports keyboard day/month navigation without changing applied values', () => {
    const day = find(calendar(), (element) => element.props['data-day'] === '2026-05-11');
    (day.props as ComponentProps<'button'>).onKeyDown?.({
      key: 'ArrowRight',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent<HTMLButtonElement>);
    expect(
      find(calendar(), (element) => element.props['data-day'] === '2026-05-12').props.tabIndex,
    ).toBe(0);
    click(calendar(), 'Next month');
    expect(find(calendar(), (element) => element.type === 'h2').props.children).toBe('June 2026');
    expect(onApply).not.toHaveBeenCalled();
  });

  it('initializes the local filters after mount and makes no statistics request', () => {
    state.index = 0;
    const loading = MyStatisticsScreen();
    find(loading, (element) => element.type === StatisticsHeaderSkeleton);
    find(loading, (element) => element.type === StatisticsInitialLoadingState);
    const loadingMarkup = renderToStaticMarkup(loading);
    expect(loadingMarkup).toContain('aria-label="Loading statistics dashboard"');
    expect(loadingMarkup).toContain('h-9 w-\[218px\]');
    expect(loadingMarkup).not.toContain('Manage your deadlines');
    expect(elements(loading).some((element) => element.props.children === 'Weekly Planner')).toBe(
      false,
    );
    state.effects.shift()?.();
    state.index = 0;
    const ready = MyStatisticsScreen();
    const toolbar = find(ready, (element) => element.type === StatisticsFiltersToolbar);
    expect(toolbar.props.filters).toMatchObject({ p_project_id: null, p_status: null });
    find(ready, (element) => element.type === StatisticsHeaderSkeleton);
    const content = find(ready, (element) => element.type === StatisticsContent);
    (content.props.onInitialSettled as (value: boolean) => void)(true);
    state.index = 0;
    const settled = MyStatisticsScreen();
    expect(elements(settled).some((element) => element.props.children === 'Weekly Planner')).toBe(
      true,
    );
    find(settled, (element) => element.type === StatisticsFiltersToolbar);
    const changed = {
      ...initialStatisticsFilters(new Date(2026, 4, 13)),
      p_status: 'DONE' as const,
    };
    (
      find(settled, (element) => element.type === StatisticsFiltersToolbar).props.onChange as (
        value: typeof changed,
      ) => void
    )(changed);
    state.index = 0;
    const refreshing = MyStatisticsScreen();
    expect(
      elements(refreshing).some((element) => element.props.children === 'Weekly Planner'),
    ).toBe(true);
    expect(
      find(refreshing, (element) => element.type === StatisticsContent).props.onInitialSettled,
    ).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('settles the initial header only after both statistics requests finish', () => {
    const markSettled = vi.fn();
    state.calendarStatus = 'success';
    state.projectsStatus = 'loading';
    StatisticsContent({ filters: initialStatisticsFilters(), onInitialSettled: markSettled });
    state.effects.shift()?.();
    expect(markSettled).not.toHaveBeenCalled();

    state.projectsStatus = 'error';
    StatisticsContent({ filters: initialStatisticsFilters(), onInitialSettled: markSettled });
    state.effects.shift()?.();
    expect(markSettled).toHaveBeenCalledExactlyOnceWith(true);
  });
});
