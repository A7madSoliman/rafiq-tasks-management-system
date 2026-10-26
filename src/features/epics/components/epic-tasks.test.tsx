import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEpicTasks } from '../hooks/use-epic-tasks';
import { EpicTasks } from './epic-tasks';

vi.mock('../hooks/use-epic-tasks', () => ({ useEpicTasks: vi.fn() }));
vi.mock('@/assets/icons/epics/add.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/epics/deadline.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/epics/details/add-task.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/epics/details/tasks-empty.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/epics/details/unassigned.svg', () => ({ default: () => null }));

const task = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  title: 'Cloud Database Schema',
  assigneeName: 'Jane Doe',
  dueDate: '2026-10-12T00:00:00+00:00',
};
const retry = vi.fn();
function render(refreshRevision?: number) {
  return renderToStaticMarkup(
    createElement(EpicTasks, {
      projectId: 'project',
      epicId: 'epic',
      onAddTask: vi.fn(),
      onTaskClick: vi.fn(),
      refreshRevision,
    }),
  );
}

describe('epic task list', () => {
  it('forwards explicit invalidation revisions without remounting the list', () => {
    render(2);
    expect(useEpicTasks).toHaveBeenCalledWith('project', 'epic', 2);
  });
  beforeEach(() => {
    vi.mocked(useEpicTasks).mockReturnValue({ tasks: [task], status: 'success', retry });
  });

  it('renders task titles, initials, names and UTC dates with desktop rows and mobile cards', () => {
    const html = render();
    expect(html).toContain(task.title);
    expect(html).toContain('Jane Doe');
    expect(html).toContain('>JD</span>');
    expect(html).toContain('12 Oct 2026');
    expect(html).toContain('Due Date');
    expect(html).toContain('md:row-span-2');
    expect(html).toContain('md:gap-0');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/Overdue|menu/);
    expect(useEpicTasks).toHaveBeenCalledWith('project', 'epic', undefined);
    expect(html).toContain('aria-label="View details for Cloud Database Schema"');
  });

  it('handles missing display fields and escapes user-provided content', () => {
    vi.mocked(useEpicTasks).mockReturnValue({
      tasks: [
        { ...task, title: ' ', assigneeName: null, dueDate: null },
        { ...task, id: 'other', title: '<script>alert(1)</script>', assigneeName: '<b>Jane</b>' },
      ],
      status: 'success',
      retry,
    });
    const html = render();
    expect(html).toContain('Untitled task');
    expect(html).toContain('Unassigned');
    expect(html).toContain('—');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<b>Jane</b>');
  });

  it('renders populated and title-only tasks together with optional-field fallbacks', () => {
    vi.mocked(useEpicTasks).mockReturnValue({
      tasks: [
        task,
        { ...task, id: 'other', title: 'Title-only task', assigneeName: null, dueDate: null },
      ],
      status: 'success',
      retry,
    });
    const html = render();
    expect(html).toContain(task.title);
    expect(html).toContain('Jane Doe');
    expect(html).toContain('12 Oct 2026');
    expect(html).toContain('Title-only task');
    expect(html).toContain('Unassigned');
    expect(html).toContain('—');
    expect(html).not.toContain('Failed to load tasks.');
  });

  it.each(['loading', 'error', 'success'] as const)(
    'shows the correct %s state while retaining Add Task',
    (status) => {
      vi.mocked(useEpicTasks).mockReturnValue({ tasks: [], status, retry });
      const html = render();
      expect(html).toContain('Add Task');
      expect(html.includes('Loading epic tasks')).toBe(status === 'loading');
      expect(html.includes('Failed to load tasks.')).toBe(status === 'error');
      expect(html.includes('>Retry</button>')).toBe(status === 'error');
      expect(html.includes('No tasks have been added')).toBe(status === 'success');
    },
  );
});
