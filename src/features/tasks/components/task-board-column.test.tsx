import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { TASK_STATUSES } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardMobileScreen } from './task-board-mobile-screen';

vi.mock('@/assets/icons/tasks/add-task.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/tasks/no-tasks.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/tasks/mobile-search.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/tasks/mobile-add-task.svg', () => ({ default: () => null }));
vi.mock('./task-board-card', () => ({
  TaskBoardCard: ({ task }: { task: CreatedTask }) => createElement('article', null, task.title),
}));

const task: CreatedTask = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  project_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  task_id: 'TASK-1',
  title: 'Locally created task',
  description: null,
  epic_id: null,
  assignee_id: null,
  due_date: null,
  status: 'TO_DO',
};

describe.each(['loading', 'error', 'success'] as const)('%s task column', (loadState) => {
  it.each([false, true])('preserves feedback and cards when tasks exist: %s', (hasTasks) => {
    const html = renderToStaticMarkup(
      createElement(TaskBoardColumn, {
        status: TASK_STATUSES[0],
        tasks: hasTasks ? [task] : [],
        loadState,
        onAddTask: vi.fn(),
        onRetry: vi.fn(),
        assigneeNamesById: new Map(),
        onTaskClick: vi.fn(),
      }),
    );

    expect(html.includes(task.title)).toBe(hasTasks);
    expect(html.includes('Loading TO DO tasks')).toBe(loadState === 'loading');
    expect(html.includes('Failed to load tasks')).toBe(loadState === 'error');
    expect(html.includes('>Retry</button>')).toBe(loadState === 'error');
    expect(html.includes('No Tasks')).toBe(loadState === 'success' && !hasTasks);
    expect(html).toContain(
      hasTasks
        ? 'aria-label="1 tasks"'
        : loadState === 'success'
          ? 'aria-label="0 tasks"'
          : `aria-label="TO DO tasks ${loadState}"`,
    );
    expect(html).toContain('lg:w-72 lg:shrink-0');
    if (hasTasks) {
      expect(html).toContain('overflow-y-auto');
    }
  });

  it.each([false, true])('preserves mobile feedback and cards when tasks exist: %s', (hasTasks) => {
    const html = renderToStaticMarkup(
      createElement(TaskBoardMobileScreen, {
        tasks: hasTasks ? [task] : [],
        isLoading: loadState === 'loading',
        failedStatuses: loadState === 'error' ? [TASK_STATUSES[0]] : [],
        onAddTask: vi.fn(),
        onRetryStatus: vi.fn(),
        assigneeNamesById: new Map(),
        onTaskClick: vi.fn(),
      }),
    );

    expect(html.includes(task.title)).toBe(hasTasks);
    expect(html.includes('Loading tasks')).toBe(loadState === 'loading');
    expect(html.includes('Retry TO DO')).toBe(loadState === 'error');
    expect(html.includes('No Tasks')).toBe(loadState === 'success' && !hasTasks);
    expect(html).toContain('lg:hidden');
  });
});
