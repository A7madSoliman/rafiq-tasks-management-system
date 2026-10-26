import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatedTask } from '../schemas/created-task-schema';
import { CreateTaskDialog } from './create-task-dialog';
import { TaskDetailsDialog } from './task-details-dialog';
import { TaskBoardDesktopHeader } from './task-board-desktop-header';
import { ProjectTasksBoardScreen } from './project-tasks-board-screen';

const state = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  desktop: true,
  retryMembers: vi.fn(),
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = state.index++;
    if (!(index in state.slots)) state.slots[index] = initial;
    return [
      state.slots[index],
      (value: unknown) => {
        state.slots[index] = typeof value === 'function' ? value(state.slots[index]) : value;
      },
    ];
  },
  useCallback: (callback: unknown) => callback,
}));
vi.mock('@/features/projects/context/current-project-context', () => ({
  useCurrentProject: () => ({ projectId: 'project', status: 'success' }),
}));
vi.mock('@/features/projects/hooks/use-project-members', () => ({
  useProjectMembers: () => ({ members: [], status: 'success', retry: state.retryMembers }),
}));
vi.mock('../hooks/use-debounced-value', () => ({ useDebouncedValue: (value: string) => value }));
vi.mock('../hooks/use-is-desktop', () => ({ useIsDesktop: () => state.desktop }));
vi.mock('./create-task-dialog', () => ({ CreateTaskDialog: () => null }));
vi.mock('./task-details-dialog', () => ({ TaskDetailsDialog: () => null }));
vi.mock('./task-board-column', () => ({ TaskBoardColumn: () => null }));
vi.mock('./task-board-mobile-screen', () => ({ TaskBoardMobileScreen: () => null }));
vi.mock('./task-board-desktop-header', () => ({ TaskBoardDesktopHeader: () => null }));
vi.mock('./project-tasks-board-loading-state', () => ({
  ProjectTasksBoardLoadingState: () => null,
}));

function renderBoard() {
  state.index = 0;
  return ProjectTasksBoardScreen();
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement<Record<string, unknown>>(child))
      result.push(child, ...elements(child.props.children as ReactNode));
  });
  return result;
}
function propsOf<T>(node: ReactNode, type: unknown): T {
  const element = elements(node).find((item) => item.type === type);
  if (!element) throw new Error('Missing screen child');
  return element.props as T;
}
const task: CreatedTask = {
  id: 'task',
  project_id: 'project',
  task_id: 'TASK-1',
  title: 'Login',
  description: null,
  assignee_id: null,
  epic_id: null,
  due_date: null,
  status: 'TO_DO',
};

describe('Board confirmed-update integration', () => {
  beforeEach(() => {
    state.slots = [];
    state.index = 0;
    state.desktop = true;
    vi.clearAllMocks();
  });

  it.each([true, false])(
    'refreshes active queries and reconciles local tasks while preserving search (Desktop: %s)',
    (desktop) => {
      state.desktop = desktop;
      let tree = renderBoard();
      propsOf<ComponentProps<typeof CreateTaskDialog>>(tree, CreateTaskDialog).onCreated?.(task);
      propsOf<ComponentProps<typeof TaskBoardDesktopHeader>>(
        tree,
        TaskBoardDesktopHeader,
      ).onSearchChange('login');
      tree = renderBoard();
      const update = propsOf<ComponentProps<typeof TaskDetailsDialog>>(
        tree,
        TaskDetailsDialog,
      ).onUpdated;
      update?.({
        projectId: 'project',
        taskId: 'task',
        changes: {
          title: 'New login',
          status: 'DONE',
          assignee_id: 'user',
          due_date: '2099-01-01T00:00:00Z',
        },
      });
      tree = renderBoard();
      let queries = elements(tree).filter((item) => 'refreshRevision' in item.props);
      expect(queries).toHaveLength(desktop ? 8 : 1);
      for (const query of queries) {
        expect(query.props.refreshRevision).toBe(1);
        expect(query.props.searchTerm).toBe('login');
        expect(query.props.localTasks).toEqual([
          {
            ...task,
            title: 'New login',
            status: 'DONE',
            assignee_id: 'user',
            due_date: '2099-01-01T00:00:00Z',
          },
        ]);
      }
      expect(state.retryMembers).toHaveBeenCalledOnce();
      update?.({ projectId: 'project', taskId: 'task', changes: { title: 'No longer matching' } });
      queries = elements(renderBoard()).filter((item) => 'refreshRevision' in item.props);
      expect(queries[0].props.refreshRevision).toBe(2);
      expect(queries[0].props.localTasks).toEqual([]);
      update?.({ projectId: 'project', taskId: 'task', changes: { title: 'Login again' } });
      queries = elements(renderBoard()).filter((item) => 'refreshRevision' in item.props);
      expect((queries[0].props.localTasks as CreatedTask[])[0].title).toBe('Login again');
    },
  );

  it('ignores confirmed callbacks scoped to another project', () => {
    const update = propsOf<ComponentProps<typeof TaskDetailsDialog>>(
      renderBoard(),
      TaskDetailsDialog,
    ).onUpdated;
    update?.({ projectId: 'other', taskId: 'task', changes: { status: 'DONE' } });
    expect(
      elements(renderBoard()).filter((item) => 'refreshRevision' in item.props)[0].props
        .refreshRevision,
    ).toBe(0);
  });
});
