import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { TASK_STATUSES } from '../constants/task-statuses';
import type { CreatedTask } from '../schemas/created-task-schema';
import { TaskBoardColumn } from './task-board-column';
import { TaskBoardMobileScreen } from './task-board-mobile-screen';

vi.mock('@/assets/icons/tasks/add-task.svg', () => ({
  default: () => null,
}));

vi.mock('@/assets/icons/tasks/no-tasks.svg', () => ({
  default: () => null,
}));

vi.mock('@/assets/icons/tasks/mobile-search.svg', () => ({
  default: () => null,
}));

vi.mock('@/assets/icons/tasks/mobile-add-task.svg', () => ({
  default: () => null,
}));

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

type DesktopColumnProps = ComponentProps<typeof TaskBoardColumn>;
type MobileProps = ComponentProps<typeof TaskBoardMobileScreen>;

function renderDesktopColumn(overrides: Partial<DesktopColumnProps> = {}): string {
  const props: DesktopColumnProps = {
    status: TASK_STATUSES[0],
    tasks: [],
    totalCount: 0,
    loadState: 'success',
    hasMore: false,
    isLoadingMore: false,
    loadMoreError: false,
    onAddTask: vi.fn(),
    onRetry: vi.fn(),
    onLoadMore: vi.fn(),
    onRetryLoadMore: vi.fn(),
    onTaskClick: vi.fn(),
    assigneeNamesById: new Map<string, string>(),
    ...overrides,
  };

  return renderToStaticMarkup(createElement(TaskBoardColumn, props));
}

/**
 * Shared mobile test renderer.
 *
 * Keep all required component props here so existing
 * pagination tests remain valid when the UI evolves.
 */
function renderMobile(overrides: Partial<MobileProps> = {}): string {
  const props: MobileProps = {
    tasks: [],
    loadState: 'success',
    hasMore: false,
    isLoadingMore: false,
    loadMoreError: false,
    onAddTask: vi.fn(),
    onRetry: vi.fn(),
    onLoadMore: vi.fn(),
    onRetryLoadMore: vi.fn(),
    onTaskClick: vi.fn(),
    assigneeNamesById: new Map<string, string>(),

    // Required controlled search input props.
    searchValue: '',
    onSearchChange: vi.fn(),

    ...overrides,
  };

  return renderToStaticMarkup(createElement(TaskBoardMobileScreen, props));
}

describe.each(['loading', 'error', 'success'] as const)('%s task column', (loadState) => {
  it.each([false, true])('preserves feedback and cards when tasks exist: %s', (hasTasks) => {
    const html = renderDesktopColumn({
      tasks: hasTasks ? [task] : [],
      totalCount: hasTasks ? 1 : 0,
      loadState,
    });

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
    const html = renderMobile({
      tasks: hasTasks ? [task] : [],
      loadState,
    });

    expect(html.includes(task.title)).toBe(hasTasks);

    expect(html.includes('Loading tasks')).toBe(loadState === 'loading');

    expect(html.includes('Try Again')).toBe(loadState === 'error');

    expect(html.includes('No Tasks')).toBe(loadState === 'success' && !hasTasks);

    expect(html).toContain('lg:hidden');
  });
});

describe('desktop pagination feedback', () => {
  it('displays total backend count, not just loaded tasks', () => {
    const html = renderDesktopColumn({
      tasks: [task],
      totalCount: 17,
      hasMore: true,
    });

    expect(html).toContain('aria-label="17 tasks"');
    expect(html).toContain(task.title);
    expect(html).toContain('overflow-y-auto');
  });

  it('preserves cards while loading the next page', () => {
    const html = renderDesktopColumn({
      tasks: [task],
      totalCount: 17,
      hasMore: true,
      isLoadingMore: true,
    });

    expect(html).toContain(task.title);
    expect(html).toContain('Loading more tasks...');
  });

  it('preserves cards and shows retry when load more fails', () => {
    const html = renderDesktopColumn({
      tasks: [task],
      totalCount: 17,
      hasMore: true,
      loadMoreError: true,
    });

    expect(html).toContain(task.title);
    expect(html).toContain('Failed to load more tasks.');
    expect(html).toContain('Try Again');
  });

  it('shows an empty column when no tasks exist', () => {
    const html = renderDesktopColumn({
      tasks: [],
      totalCount: 0,
      hasMore: false,
    });

    expect(html).toContain('No Tasks');
    expect(html).toContain('aria-label="0 tasks"');
  });
});

describe('mobile pagination feedback', () => {
  it('keeps loaded tasks visible while loading more', () => {
    const html = renderMobile({
      tasks: [task],
      hasMore: true,
      isLoadingMore: true,
    });

    expect(html).toContain(task.title);
    expect(html).toContain('Loading more tasks...');
  });

  it('shows retry without removing loaded tasks', () => {
    const html = renderMobile({
      tasks: [task],
      hasMore: true,
      loadMoreError: true,
    });

    expect(html).toContain(task.title);
    expect(html).toContain('Failed to load more tasks.');
    expect(html).toContain('Try Again');
  });

  it('renders the empty state correctly', () => {
    const html = renderMobile({
      tasks: [],
      hasMore: false,
    });

    expect(html).toContain('No Tasks');
  });

  it('shows an initial loading error', () => {
    const html = renderMobile({
      tasks: [],
      loadState: 'error',
    });

    expect(html).toContain('Failed to load tasks.');
    expect(html).toContain('Try Again');
    expect(html).not.toContain('No Tasks');
  });
});

describe('mobile task search UI', () => {
  it('renders the controlled search input', () => {
    const html = renderMobile({
      searchValue: 'login',
    });

    expect(html).toContain('aria-label="Search tasks"');
    expect(html).toContain('placeholder="Search tasks..."');
    expect(html).toContain('value="login"');
  });

  it('shows a search-specific empty state', () => {
    const html = renderMobile({
      tasks: [],
      searchValue: 'nonexistent task',
    });

    expect(html).toContain('No Matching Tasks');
    expect(html).not.toContain('No Tasks');
  });
});
