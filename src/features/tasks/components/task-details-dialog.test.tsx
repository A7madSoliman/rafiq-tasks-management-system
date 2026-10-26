import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTaskDetails } from '../hooks/use-task-details';
import { useTaskUpdates } from '../hooks/use-task-updates';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import { useTaskEpics } from '../hooks/use-task-epics';
import type { TaskDetails } from '../schemas/task-details-schema';
import { TaskDetailsDialog } from './task-details-dialog';

const view = vi.hoisted(() => ({
  portal: null as ReactNode,
  effects: [] as (() => (() => void) | void)[],
}));
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useEffect: (effect: () => (() => void) | void) => {
    view.effects.push(effect);
  },
}));
vi.mock('react-dom', () => ({
  createPortal: (node: ReactNode) => {
    view.portal = node;
    return node;
  },
}));
vi.mock('../hooks/use-task-details', () => ({ useTaskDetails: vi.fn() }));
vi.mock('../hooks/use-task-updates', () => ({ useTaskUpdates: vi.fn() }));
vi.mock('@/features/projects/hooks/use-project-members', () => ({ useProjectMembers: vi.fn() }));
vi.mock('../hooks/use-task-epics', () => ({ useTaskEpics: vi.fn() }));
vi.mock('@/assets/icons/navigation/close.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/epics/details/date.svg', () => ({ default: () => null }));

const task: TaskDetails = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  taskCode: 'TASK-10',
  title: 'Task title',
  description: null,
  canEdit: true,
  assigneeId: null,
  assigneeName: null,
  epic: null,
  dueDate: null,
  status: 'TO_DO',
  createdAt: null,
  createdByName: null,
};
const onClose = vi.fn();
let editor: ReturnType<typeof useTaskUpdates>;
const cleanups: (() => void)[] = [];

function render() {
  return renderToStaticMarkup(
    createElement(TaskDetailsDialog, { projectId: task.projectId, taskId: task.id, onClose }),
  );
}
type ElementProps = {
  children?: ReactNode;
  role?: string;
  ref?: { current: unknown };
  onClick?: () => void;
};
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  const result: ReactElement<ElementProps>[] = [];
  Children.forEach(node, (child) => {
    if (isValidElement<ElementProps>(child)) result.push(child, ...elements(child.props.children));
  });
  return result;
}

describe('TaskDetailsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    view.effects = [];
    view.portal = null;
    vi.stubGlobal('document', {});
    editor = {
      title: task.title,
      description: '',
      assigneeId: '',
      epicId: '',
      dueDate: '',
      status: 'TO_DO',
      saving: {},
      errors: {},
      isClosing: false,
      change: vi.fn(),
      save: vi.fn(async () => true),
      close: vi.fn(async (close: () => void) => close()),
    };
    vi.mocked(useTaskDetails).mockReturnValue({ task, status: 'success', retry: vi.fn() });
    vi.mocked(useTaskUpdates).mockImplementation(() => editor);
    vi.mocked(useProjectMembers).mockReturnValue({
      members: [],
      status: 'success',
      retry: vi.fn(),
    });
    vi.mocked(useTaskEpics).mockReturnValue({ epics: [], status: 'success', retry: vi.fn() });
  });
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
  });

  it('renders text and attribute editors with the existing responsive dimensions', () => {
    const html = render();
    expect(html).toContain('id="task-details-title"');
    expect(html).toContain('id="task-details-description"');
    expect(html).toContain('placeholder="No description provided."');
    expect(html).toContain('md:max-w-[896px]');
    expect(html).toContain('rounded-t-[24px]');
    expect(html).toContain('md:min-h-[472px]');
    expect(html).toContain('aria-label="Task assignee"');
    expect(html).toContain('aria-label="Task epic"');
    expect(html).toContain('aria-label="Task status"');
    expect(html).toContain('type="date"');
    expect(html).toContain('Created By');
    expect(html).toContain('Created At');
  });

  it('renders Viewer text and the empty-description fallback without editors', () => {
    vi.mocked(useTaskDetails).mockReturnValue({
      task: { ...task, canEdit: false },
      status: 'success',
      retry: vi.fn(),
    });
    const html = render();
    expect(html).toContain('Task title');
    expect(html).toContain('No description provided.');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('<select');
    expect(useProjectMembers).toHaveBeenCalledWith(task.projectId, false);
    expect(useTaskEpics).toHaveBeenCalledWith(task.projectId, false);
  });

  it('retains unavailable assignee, epic and unknown status options without clearing them', () => {
    editor = {
      ...editor,
      assigneeId: 'missing-member',
      epicId: 'missing-epic',
      status: 'LEGACY_STATUS',
    };
    const html = render();
    expect(html).toContain('value="missing-member" disabled="" selected=""');
    expect(html).toContain('value="missing-epic" disabled="" selected=""');
    expect(html).toContain('value="LEGACY_STATUS" disabled="" selected=""');
    expect(html).toContain('Unassigned');
    expect(html).toContain('No Epic');
    expect(editor.save).not.toHaveBeenCalled();
  });

  it('shows option loading and retry feedback and uses user IDs for assignee options', () => {
    vi.mocked(useProjectMembers).mockReturnValue({
      members: [
        {
          id: 'membership-id',
          userId: 'user-id',
          name: 'Jane',
          email: 'jane@example.com',
          role: 'member',
        },
      ],
      status: 'success',
      retry: vi.fn(),
    });
    vi.mocked(useTaskEpics).mockReturnValue({ epics: [], status: 'error', retry: vi.fn() });
    let html = render();
    expect(html).toContain('value="user-id"');
    expect(html).not.toContain('value="membership-id"');
    expect(html).toContain('Unable to load epics. Retry');
    vi.mocked(useProjectMembers).mockReturnValue({
      members: [],
      status: 'loading',
      retry: vi.fn(),
    });
    html = render();
    expect(html).toContain('Loading members...');
  });

  it('disables only the saving field and associates accessible feedback', () => {
    editor = {
      ...editor,
      saving: { title: true },
      errors: { description: 'Failed to update task. Please try again.' },
    };
    const html = render();
    expect(html).toMatch(/<input[^>]*disabled=""/);
    expect(html).not.toMatch(/<textarea[^>]* disabled=""/);
    expect(html).toContain('aria-describedby="task-title-saving"');
    expect(html).toContain('aria-describedby="task-description-error"');
    expect(html).toContain('Saving title...');
    expect(html).toContain('role="alert"');
  });

  it.each(['loading', 'error', 'not-found'] as const)('preserves the %s state', (status) => {
    vi.mocked(useTaskDetails).mockReturnValue({ task: null, status, retry: vi.fn() });
    const html = render();
    expect(html).toContain(
      status === 'loading'
        ? 'Loading task details'
        : status === 'error'
          ? 'Failed to load task details'
          : 'Task not found',
    );
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<textarea');
  });

  it('routes backdrop, Mobile close and Desktop close through the save-aware handler', () => {
    render();
    const buttons = elements(view.portal).filter(
      (element) => element.type === 'button' && element.props.onClick,
    );
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => button.props.onClick?.());
    expect(editor.close).toHaveBeenCalledTimes(3);
    expect(editor.close).toHaveBeenCalledWith(onClose);
  });

  it('includes text controls in the focus trap and restores focus/body scrolling on cleanup', () => {
    class Target {
      tabIndex = 0;
      focus = vi.fn();
      getClientRects() {
        return [{}];
      }
    }
    const previous = new Target();
    const first = new Target();
    const last = new Target();
    const listeners = new Map<string, (event: unknown) => void>();
    const dom = {
      activeElement: previous,
      body: { style: { overflow: 'auto' } },
      addEventListener: vi.fn((name: string, handler: (event: unknown) => void) =>
        listeners.set(name, handler),
      ),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('document', dom);
    vi.stubGlobal('HTMLElement', Target);
    const dialog = {
      focus: vi.fn(),
      querySelectorAll: vi.fn(() => [first, last]),
      contains: () => true,
    };
    render();
    const section = elements(view.portal).find((element) => element.props.role === 'dialog');
    if (!section?.props.ref) throw new Error('Missing dialog ref');
    section.props.ref.current = dialog;
    for (const effect of view.effects.splice(0)) {
      const cleanup = effect();
      if (cleanup) cleanups.push(cleanup);
    }
    expect(dom.body.style.overflow).toBe('hidden');
    expect(dialog.focus).toHaveBeenCalledOnce();
    const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    dom.activeElement = last;
    listeners.get('keydown')?.(event);
    expect(first.focus).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(dialog.querySelectorAll).toHaveBeenCalledWith(
      expect.stringContaining('input:not([disabled]), textarea:not([disabled])'),
    );
    dom.activeElement = first;
    listeners.get('keydown')?.({ ...event, shiftKey: true });
    expect(last.focus).toHaveBeenCalledOnce();
    listeners.get('keydown')?.({
      key: 'Escape',
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    });
    expect(editor.close).toHaveBeenCalledWith(onClose);
    cleanups.splice(0).forEach((cleanup) => cleanup());
    expect(dom.body.style.overflow).toBe('auto');
    expect(previous.focus).toHaveBeenCalledOnce();
    expect(dom.removeEventListener).toHaveBeenCalledTimes(2);
  });
});
