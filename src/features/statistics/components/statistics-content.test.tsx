import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { StatisticsContent } from './my-statistics-screen';

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
    expect(view()).toContain('Loading calendar statistics');
    expect(view()).toContain('Loading project statistics');
    expect(view()).not.toContain('Summary loaded');
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
  });

  it('keeps successful projects visible if calendar fails', () => {
    state.calendar = { status: 'error', retry: vi.fn() };
    state.projects = { status: 'success', data: [] };
    const markup = view();
    expect(markup).toContain('Projects loaded');
    expect(markup).toContain('Unable to load calendar statistics');
    expect(markup).not.toContain('Summary loaded');
  });
});
