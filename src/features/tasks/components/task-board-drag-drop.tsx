'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Accessibility,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/dom';
import {
  DragDropProvider,
  DragOverlay,
  useDragDropManager,
  useDraggable,
  useDroppable,
} from '@dnd-kit/react';
import { cn } from '@/lib/cn';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';
import { createdTaskSchema, type CreatedTask } from '../schemas/created-task-schema';
import {
  boardDragSourceSchema,
  boardDropTargetSchema,
  getTaskMoveIntent,
  type BoardDragSource,
  type TaskMoveIntent,
} from '../utils/task-board-move-intent';
import { boardPointerSensor, boardKeyboardSensor } from '../utils/task-board-sensors';
import { TaskBoardCard } from './task-board-card';

type BoardDragContextValue = {
  projectId: string;
  mobile: boolean;
  disabled: boolean;
  active: BoardDragSource | null;
  canOpenDetails: () => boolean;
};
const BoardDragContext = createContext<BoardDragContextValue | null>(null);
const sensors = [boardPointerSensor, boardKeyboardSensor];
const labelFor = (status: TaskStatus) =>
  TASK_STATUSES.find((item) => item.value === status)?.label ?? status;

function DragScope({ scopeKey, disabled }: { scopeKey: string; disabled: boolean }) {
  const manager = useDragDropManager();
  useEffect(() => {
    return () => {
      manager?.actions.stop({ canceled: true });
    };
  }, [manager, scopeKey, disabled]);
  return null;
}

export function TaskBoardDragDrop({
  projectId,
  mobile,
  searchKey,
  disabled,
  onMoveIntent,
  children,
}: {
  projectId: string;
  mobile: boolean;
  searchKey: string;
  disabled: boolean;
  onMoveIntent?: (intent: TaskMoveIntent, task: CreatedTask) => void;
  children: ReactNode;
}) {
  const [active, setActive] = useState<BoardDragSource | null>(null);
  const [message, setMessage] = useState('');
  const suppressUntilRef = useRef(0);
  const activeRef = useRef(false);
  const plugins = useMemo<NonNullable<ComponentProps<typeof DragDropProvider>['plugins']>>(
    () => (defaults) => [
      ...defaults.filter((plugin) => plugin !== Accessibility),
      Accessibility.configure({
        screenReaderInstructions: {
          draggable:
            'Press Enter to open task details or Space to pick up the task. Use arrow keys to choose a status, Space or Enter to drop, or Escape to cancel.',
        },
        announcements: {
          dragstart({ operation }: DragStartEvent) {
            const parsed = boardDragSourceSchema.safeParse(operation.source?.data);
            return parsed.success
              ? `Picked up ${parsed.data.title}. Choose a destination status.`
              : undefined;
          },
          dragover({ operation }: DragOverEvent) {
            const parsed = boardDropTargetSchema.safeParse(operation.target?.data);
            const source = boardDragSourceSchema.safeParse(operation.source?.data);
            return parsed.success
              ? `${labelFor(parsed.data.status)} status target.${source.success && source.data.sourceStatus === parsed.data.status ? ' Current status; no change.' : ''}`
              : 'Outside a valid status target.';
          },
          dragend({ canceled }: DragEndEvent) {
            return canceled ? 'Task drag cancelled. Status unchanged.' : undefined;
          },
        },
      }),
    ],
    [],
  );

  return (
    <BoardDragContext.Provider
      value={{
        projectId,
        mobile,
        disabled,
        active,
        canOpenDetails: () => !activeRef.current && Date.now() >= suppressUntilRef.current,
      }}
    >
      <DragDropProvider
        sensors={sensors}
        plugins={plugins}
        onBeforeDragStart={(event) => {
          const parsed = boardDragSourceSchema.safeParse(event.operation.source?.data);
          if (
            disabled ||
            !parsed.success ||
            parsed.data.projectId !== projectId ||
            event.operation.source?.disabled
          )
            event.preventDefault();
        }}
        onDragStart={({ operation }) => {
          const parsed = boardDragSourceSchema.safeParse(operation.source?.data);
          if (!parsed.success) return;
          activeRef.current = true;
          setActive(parsed.data);
          setMessage('');
        }}
        onDragEnd={(event) => {
          activeRef.current = false;
          suppressUntilRef.current = Date.now() + 350;
          const pointerOutside =
            typeof PointerEvent !== 'undefined' &&
            event.nativeEvent instanceof PointerEvent &&
            !event.operation.target?.element?.contains(
              document.elementFromPoint(event.nativeEvent.clientX, event.nativeEvent.clientY),
            );
          const intent = getTaskMoveIntent({
            projectId,
            source: event.operation.source?.data,
            target: event.operation.target?.data,
            canceled: event.canceled,
            disabled:
              disabled ||
              Boolean(event.operation.source?.disabled) ||
              Boolean(event.operation.target?.disabled) ||
              pointerOutside,
          });
          setActive(null);
          if (intent) {
            const task = createdTaskSchema.safeParse(event.operation.source?.data?.task);
            if (
              task.success &&
              task.data.id === intent.taskId &&
              task.data.project_id === projectId &&
              task.data.status === intent.sourceStatus
            ) {
              onMoveIntent?.(intent, task.data);
              setMessage(`Moving ${task.data.title} to ${labelFor(intent.destinationStatus)}.`);
            }
          } else if (!event.canceled) setMessage('No status change requested.');
          const handle = event.operation.source?.handle;
          if (!disabled && handle instanceof HTMLElement)
            requestAnimationFrame(() => {
              if (handle.isConnected) handle.focus({ preventScroll: true });
            });
        }}
      >
        <DragScope scopeKey={JSON.stringify([projectId, mobile, searchKey])} disabled={disabled} />
        {children}
        <MobileStatusTray />
        <DragOverlay dropAnimation={null} className="pointer-events-none z-[70]">
          {active && (
            <div
              aria-hidden="true"
              inert
              className="border-primary bg-surface text-foreground max-w-72 rounded-md border p-4 text-sm shadow-lg"
            >
              {active.title}
            </div>
          )}
        </DragOverlay>
        <p role="status" className="text-foreground-muted px-4 text-xs lg:px-8">
          {disabled || !message.startsWith('Moving ') ? message : ''}
        </p>
      </DragDropProvider>
    </BoardDragContext.Provider>
  );
}

type CardProps = ComponentProps<typeof TaskBoardCard> & { canMove?: boolean };
export function BoardTaskCard({ canMove = false, ...props }: CardProps) {
  const board = useContext(BoardDragContext);
  const manager = useDragDropManager();
  useEffect(() => {
    if (
      (!canMove || board?.disabled) &&
      manager?.dragOperation.source?.id === `task:${props.task.project_id}:${props.task.id}`
    ) {
      manager.actions.stop({ canceled: true });
    }
  }, [canMove, board?.disabled, manager, props.task.project_id, props.task.id]);
  const onTaskClick = (taskId: string) => {
    if (!board || board.canOpenDetails()) props.onTaskClick(taskId);
  };
  return board && canMove && !board.disabled ? (
    <DraggableTaskCard {...props} onTaskClick={onTaskClick} board={board} />
  ) : (
    <TaskBoardCard {...props} onTaskClick={onTaskClick} />
  );
}

function DraggableTaskCard({
  board,
  ...props
}: ComponentProps<typeof TaskBoardCard> & { board: BoardDragContextValue }) {
  const { task } = props;
  const { ref, handleRef, isDragSource } = useDraggable({
    id: `task:${board.projectId}:${task.id}`,
    type: 'task-status',
    data: {
      projectId: task.project_id,
      taskId: task.id,
      sourceStatus: task.status,
      title: task.title,
      task,
      canEdit: true,
      mobile: board.mobile,
    },
    disabled: board.disabled,
  });
  return (
    <TaskBoardCard {...props} dragRef={ref} dragging={isDragSource} activationRef={handleRef} />
  );
}

type TargetRenderProps = {
  ref?: (element: Element | null) => void;
  highlighted: boolean;
  current: boolean;
};
type StatusTargetProps = {
  status: TaskStatus;
  available: boolean;
  children: (props: TargetRenderProps) => ReactNode;
};
export function BoardStatusTarget(props: StatusTargetProps) {
  const board = useContext(BoardDragContext);
  return board ? (
    <RegisteredStatusTarget {...props} board={board} />
  ) : (
    props.children({ highlighted: false, current: false })
  );
}

function RegisteredStatusTarget({
  status,
  available,
  children,
  board,
}: StatusTargetProps & { board: BoardDragContextValue }) {
  const { ref, isDropTarget } = useDroppable({
    id: `status:${board.projectId}:${status}`,
    accept: 'task-status',
    data: { projectId: board.projectId, status, available: available && !board.disabled },
    disabled: !available || board.disabled,
  });
  return children({
    ref,
    highlighted: Boolean(board.active) && board.active?.sourceStatus !== status && isDropTarget,
    current: board.active?.sourceStatus === status,
  });
}

export function MobileStatusTray() {
  const board = useContext(BoardDragContext);
  if (!board?.mobile || !board.active || board.disabled) return null;
  return (
    <section
      aria-label="Move to status"
      className="border-surface-highest bg-surface fixed inset-x-4 bottom-[calc(64px+env(safe-area-inset-bottom)+8px)] z-50 rounded-md border p-3 shadow-lg"
    >
      <h2 className="text-foreground mb-2 text-sm font-semibold">Move to status</h2>
      <div className="grid grid-cols-2 gap-2">
        {TASK_STATUSES.map((status) => (
          <BoardStatusTarget key={status.value} status={status.value} available>
            {({ ref, highlighted, current }) => (
              <div
                ref={ref}
                aria-label={`${status.label}${current ? ', current status; no change' : ''}`}
                className={cn(
                  'border-surface-highest text-foreground flex min-h-11 items-center justify-center rounded-sm border px-2 py-2 text-center text-xs font-semibold',
                  highlighted
                    ? 'border-primary bg-surface-nested ring-primary ring-2'
                    : 'bg-surface-low',
                  current && 'text-foreground-muted',
                )}
              >
                {status.boardLabel}
                {current && <span className="ml-1 font-normal">(current)</span>}
              </div>
            )}
          </BoardStatusTarget>
        ))}
      </div>
    </section>
  );
}
