import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarStatistics } from '../schemas/statistics-schema';
import { StatisticsSummary } from './statistics-summary';
import { StatisticsCalendar } from './statistics-calendar';
import { AllProjectsStatistics, TasksByStatus } from './statistics-analytics';

vi.mock('@/assets/icons/statistics/total-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/completed-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/overdue-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/mobile-total-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/mobile-completed-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/mobile-overdue-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/statistics/no-day-tasks.svg', () => ({ default: () => null }));

const data: CalendarStatistics = {
  daily: [
    { day: '2026-05-10', statuses: {} },
    { day: '2026-05-11', statuses: { TO_DO: 2, DONE: 1 } },
  ],
  totals: { TO_DO: 2, DONE: 1 },
  total_tasks: 3,
  done_tasks: 1,
  overdue_tasks: 9,
};

describe('statistics visualizations', () => {
  it('maps authoritative KPIs and explains the overdue time scope', () => {
    const markup = renderToStaticMarkup(<StatisticsSummary data={data} />);
    expect(markup).toContain('Total Tasks: 3');
    expect(markup).toContain('Completed Tasks: 1');
    expect(markup).toContain('Overdue Tasks: 9');
    expect(markup).toContain('regardless of selected dates');
  });

  it('shows the same daily backend counts in desktop and mobile layouts', () => {
    const markup = renderToStaticMarkup(<StatisticsCalendar data={data} />);
    expect(markup).toContain('Sun 10 May');
    expect(markup).toContain('Mon 11 May');
    expect(markup).toContain('No tasks');
    expect(markup).toContain('TO DO');
    expect(markup).toContain('DONE');
    expect(markup).toContain('Mon 11 May: 3 tasks');
  });

  it('renders valid SVG geometry for one or eight statuses and for an empty range', () => {
    for (const totals of [
      { DONE: 5 },
      {
        TO_DO: 1,
        IN_PROGRESS: 1,
        BLOCKED: 1,
        IN_REVIEW: 1,
        READY_FOR_QA: 1,
        REOPENED: 1,
        READY_FOR_PRODUCTION: 1,
        DONE: 1,
      },
      {},
    ] as const) {
      const markup = renderToStaticMarkup(
        <TasksByStatus
          data={{
            ...data,
            totals,
            total_tasks: Object.values(totals).reduce((sum, count) => sum + count, 0),
          }}
        />,
      );
      expect(markup).toContain('Tasks by Status');
      expect(markup).not.toContain('NaN');
      expect(markup).not.toContain('Infinity');
      expect((markup.match(/stroke-dasharray/g) ?? []).length).toBe(Object.keys(totals).length);
      if (Object.keys(totals).length === 0) expect(markup).toContain('No tasks in this range.');
    }
  });

  it('shows only returned projects, including empty and long-name cases', () => {
    const empty = renderToStaticMarkup(<AllProjectsStatistics projects={[]} />);
    expect(empty).toContain('No project tasks in this date range.');
    const filled = renderToStaticMarkup(
      <AllProjectsStatistics
        projects={[
          {
            project_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            project_name: 'A long project name that should wrap inside the card',
            tasks_count: 1,
          },
        ]}
      />,
    );
    expect(filled).toContain('A long project name');
    expect(filled).toContain('1 Task');
    expect(filled).toContain('selected dates only');
  });
});
