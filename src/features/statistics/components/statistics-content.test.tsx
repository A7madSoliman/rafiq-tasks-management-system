import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StatisticsContent } from './my-statistics-screen';
import { StatisticsCalendarSkeleton } from './statistics-loading-state';

const state = vi.hoisted(() => ({
  calendar: { status: 'loading' } as unknown,
  projects: { status: 'loading' } as unknown,
}));
vi.mock('../hooks/use-statistics-data', () => ({
  useStatisticsData: () => ({ calendar: state.calendar, projects: state.projects }),
}));
vi.mock('./statistics-summary', () => ({ StatisticsSummary: () => <div>Summary loaded</div> }));
vi.mock('./statistics-calendar', () => ({ StatisticsCalendar: () => <div>Calendar loaded</div> }));
vi.mock('./statistics-analytics', () => ({
  TasksByStatus: () => <div>Chart loaded</div>,
  AllProjectsStatistics: () => <div>Projects loaded</div>,
}));

const filters = {
  p_start_date: '2026-05-10',
  p_end_date: '2026-05-16',
  p_project_id: null,
  p_status: null,
};
const view = () => renderToStaticMarkup(<StatisticsContent filters={filters} />);

describe('statistics section composition', () => {
  it('shows loading feedback without fake KPI values', () => {
    state.calendar = { status: 'loading' };
    state.projects = { status: 'loading' };
    const markup = view();
    expect(markup).toContain('aria-label="Loading calendar statistics"');
    expect(markup).toContain('aria-label="Loading project statistics"');
    expect(markup).toContain('motion-reduce:animate-none');
    expect((markup.match(/min-h-\[104px\]/g) ?? []).length).toBe(3);
    expect((markup.match(/h-\[420px\]/g) ?? []).length).toBe(7);
    expect(markup).toContain('border-\[14px\]');
    expect(markup).not.toContain('Tasks by Status');
    expect(markup).not.toContain('Counts use the selected dates only.');
    expect(markup).toContain('class="sr-only">Task Statistics</h2>');
    expect(markup).not.toContain('Summary loaded');
    expect(markup).not.toContain('Retry');
  });

  it('matches shorter date ranges in both calendar layouts', () => {
    const markup = renderToStaticMarkup(
      <StatisticsCalendarSkeleton
        range={{ p_start_date: '2026-05-10', p_end_date: '2026-05-11' }}
      />,
    );
    expect((markup.match(/h-\[420px\]/g) ?? []).length).toBe(2);
    expect((markup.match(/min-h-11/g) ?? []).length).toBe(2);
  });

  it('replaces only the affected section during independent loading', () => {
    state.calendar = { status: 'loading' };
    state.projects = { status: 'success', data: [] };
    const calendarLoading = view();
    expect(calendarLoading).toContain('Projects loaded');
    expect(calendarLoading).toContain('Loading calendar statistics');
    expect(calendarLoading).not.toContain('Loading project statistics');

    state.calendar = { status: 'success', data: {} };
    state.projects = { status: 'loading' };
    const projectsLoading = view();
    expect(projectsLoading).toContain('Summary loaded');
    expect(projectsLoading).toContain('Calendar loaded');
    expect(projectsLoading).toContain('Chart loaded');
    expect(projectsLoading).toContain('Loading project statistics');
    expect(projectsLoading).not.toContain('Loading calendar statistics');
    expect(projectsLoading).not.toContain('Counts use the selected dates only.');
  });

  it('keeps successful calendar sections visible if projects fail, with project retry', () => {
    state.calendar = { status: 'success', data: {} };
    state.projects = { status: 'error', retry: vi.fn() };
    const markup = view();
    expect(markup).toContain('Summary loaded');
    expect(markup).toContain('Calendar loaded');
    expect(markup).toContain('Chart loaded');
    expect(markup).toContain('Unable to load project statistics');
    expect(markup).toContain('Retry');
    expect(markup).not.toContain('Loading project statistics');
  });

  it('keeps successful projects visible if calendar fails', () => {
    state.calendar = { status: 'error', retry: vi.fn() };
    state.projects = { status: 'success', data: [] };
    const markup = view();
    expect(markup).toContain('Projects loaded');
    expect(markup).toContain('Unable to load calendar statistics');
    expect(markup).not.toContain('Summary loaded');
    expect(markup).not.toContain('Loading calendar statistics');
  });

  it('does not keep skeletons after an empty successful response', () => {
    state.calendar = { status: 'success', data: { daily: [], totals: {}, total_tasks: 0 } };
    state.projects = { status: 'success', data: [] };
    const markup = view();
    expect(markup).toContain('Summary loaded');
    expect(markup).toContain('Projects loaded');
    expect(markup).not.toContain('Loading calendar statistics');
    expect(markup).not.toContain('Loading project statistics');
  });
});
