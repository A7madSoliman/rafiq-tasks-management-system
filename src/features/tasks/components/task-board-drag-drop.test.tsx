import { type ComponentProps, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DragDropProvider } from '@dnd-kit/react';
import type { CreatedTask } from '../schemas/created-task-schema';
import { TASK_STATUSES } from '../constants/task-statuses';
import { TaskBoardCard } from './task-board-card';
import { BoardStatusTarget, BoardTaskCard, TaskBoardDragDrop } from './task-board-drag-drop';

type ProviderProps = ComponentProps<typeof DragDropProvider>;
const state = vi.hoisted(() => ({
  slots: [] as unknown[],
  index: 0,
  provider: {} as ProviderProps,
  card: {} as ComponentProps<typeof TaskBoardCard>,
  targets: [] as { data: { status: string }; disabled: boolean }[],
  effects: [] as (() => void | (() => void))[],
  stop: vi.fn(),
  draggable: vi.fn(),
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  useState(initial: unknown) {
    const index = state.index++;
    if (!(index in state.slots)) state.slots[index] = initial;
    return [state.slots[index], (value: unknown) => (state.slots[index] = value)];
  },
  useRef(initial: unknown) {
    const index = state.index++;
    if (!(index in state.slots)) state.slots[index] = { current: initial };
    return state.slots[index];
  },
  useEffect(effect: () => void | (() => void)) {
    state.effects.push(effect);
  },
}));
vi.mock('@dnd-kit/react', () => ({
  DragDropProvider(props: ProviderProps) {
    state.provider = props;
    return props.children;
  },
  DragOverlay: () => null,
  useDragDropManager: () => ({ actions: { stop: state.stop }, dragOperation: {} }),
  useDraggable: (input: unknown) => {
    state.draggable(input);
    return { ref: vi.fn(), handleRef: vi.fn(), isDragSource: false };
  },
  useDroppable: (input: (typeof state.targets)[number]) => {
    state.targets.push(input);
    return { ref: vi.fn(), isDropTarget: false };
  },
}));
vi.mock('./task-board-card', async (original) => {
  const actual = await original<typeof import('./task-board-card')>();
  return {
    TaskBoardCard(props: ComponentProps<typeof TaskBoardCard>) {
      state.card = props;
      return actual.TaskBoardCard(props);
    },
  };
});
vi.mock('@/assets/icons/epics/deadline.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/validation-passed.svg', () => ({ default: () => null }));

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const task: CreatedTask = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  project_id: projectId,
  task_id: 'TASK-1',
  title: 'Login',
  description: null,
  assignee_id: null,
  epic_id: null,
  due_date: null,
  status: 'TO_DO',
};
const source = {
  data: {
    projectId,
    taskId: task.id,
    title: task.title,
    sourceStatus: task.status,
    canEdit: true,
    mobile: true,
  },
};
const target = { data: { projectId, status: 'DONE', available: true } };
const onMoveIntent = vi.fn();
const onTaskClick = vi.fn();
function render(overrides: Partial<ComponentProps<typeof TaskBoardDragDrop>> = {}, canMove = true) {
  state.index = 0;
  state.targets = [];
  return renderToStaticMarkup(
    <TaskBoardDragDrop
      projectId={projectId}
      mobile
      searchKey=""
      disabled={false}
      onMoveIntent={onMoveIntent}
      {...overrides}
    >
      {overrides.children ?? (
        <BoardTaskCard task={task} onTaskClick={onTaskClick} canMove={canMove} mobile />
      )}
    </TaskBoardDragDrop>,
  );
}
function start() {
  emit('onDragStart', { operation: { source } });
}
function end(canceled = false) {
  emit('onDragEnd', { operation: { source, target }, canceled });
}
function emit(name: 'onDragStart' | 'onDragEnd' | 'onBeforeDragStart', event: unknown) {
  // These provider callbacks only read event data; the mock has no live DOM manager.
  const handler = state.provider[name] as ((event: unknown) => void) | undefined;
  handler?.(event);
}

describe('Board drag interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.slots = [];
    state.effects = [];
    // The Node renderer has no DOM; the source has no handle to restore in these tests.
    vi.stubGlobal('HTMLElement', class {});
  });

  it('renders a separate accessible Move button and preserves the details button', () => {
    const html = render();
    expect(html).toContain('aria-label="Move task Login"');
    expect(html).toContain('min-h-11 min-w-11');
    expect(html).toContain('touch-none');
    expect(html.match(/<button\b/g)).toHaveLength(2);
    expect(html).not.toMatch(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*<button\b/);
    const handle = state.card.moveHandle as ReactElement<{
      onClick: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
    }>;
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    handle.props.onClick(event);
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(onTaskClick).not.toHaveBeenCalled();
    state.card.onTaskClick(task.id);
    expect(onTaskClick).toHaveBeenCalledWith(task.id);
    start();
    state.card.onTaskClick(task.id);
    expect(onTaskClick).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    'hides Move controls for Viewer or disabled board (disabled: %s)',
    (disabled) => {
      const html = render({ disabled }, disabled);
      expect(html).not.toContain('Move task');
      expect(state.draggable).not.toHaveBeenCalled();
    },
  );

  it('rejects activation without edit permission', () => {
    render();
    const preventDefault = vi.fn();
    emit('onBeforeDragStart', {
      operation: { source: { data: { ...source.data, canEdit: false } } },
      preventDefault,
    });
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('shows all eight Mobile targets only during dragging and emits an intent without moving cards', () => {
    expect(render()).not.toContain('Move to status');
    start();
    const html = render();
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('safe-area-inset-bottom');
    expect(html).toContain('current status; no change');
    expect(state.targets.map((item) => item.data.status)).toEqual(
      TASK_STATUSES.map((item) => item.value),
    );
    end();
    expect(onMoveIntent).toHaveBeenCalledExactlyOnceWith({
      projectId,
      taskId: task.id,
      sourceStatus: 'TO_DO',
      destinationStatus: 'DONE',
    });
    const after = render();
    expect(after).not.toContain('Move to status');
    expect(after).toContain('Task status is unchanged.');
    expect(state.card.task.status).toBe('TO_DO');
    state.card.onTaskClick(task.id);
    expect(onTaskClick).not.toHaveBeenCalled();
  });

  it('does not emit a move on cancellation and cleans up the status tray', () => {
    render();
    start();
    render();
    end(true);
    expect(onMoveIntent).not.toHaveBeenCalled();
    expect(render()).not.toContain('Move to status');
  });

  it('registers empty Desktop columns and disables unavailable targets', () => {
    render({
      mobile: false,
      children: TASK_STATUSES.map((status, index) => (
        <BoardStatusTarget key={status.value} status={status.value} available={index !== 1}>
          {({ ref }) => <section ref={ref} aria-label={status.label} />}
        </BoardStatusTarget>
      )),
    });
    expect(state.targets).toHaveLength(8);
    expect(state.targets.map((item) => item.disabled)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('cancels the active operation when the board scope is disposed or changed', () => {
    render();
    // The scope effect owns cleanup for project, search, breakpoint and modal dependencies.
    for (const effect of state.effects) {
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanup();
    }
    expect(state.stop).toHaveBeenCalledWith({ canceled: true });
  });
});
