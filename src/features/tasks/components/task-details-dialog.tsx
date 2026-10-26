'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@/assets/icons/navigation/close.svg';
import DateIcon from '@/assets/icons/epics/details/date.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/ui/field-label';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import { useTaskEpics } from '../hooks/use-task-epics';
import type { TaskUpdateEvent } from '../types/task-update-event';
import { TASK_STATUSES } from '../constants/task-statuses';
import { useTaskDetails } from '../hooks/use-task-details';
import { useTaskUpdates } from '../hooks/use-task-updates';
import type { TaskDetails } from '../schemas/task-details-schema';

type TaskDetailsDialogProps = {
  projectId: string;
  taskId: string | null;
  onClose: () => void;
  onUpdated?: (event: TaskUpdateEvent) => void;
};

type DialogContentProps = {
  projectId: string;
  taskId: string;
  onClose: () => void;
  onUpdated?: (event: TaskUpdateEvent) => void;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(value: string | null) {
  if (!value) return 'â€”';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'â€”' : dateFormatter.format(date);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function DetailField({
  label,
  children,
  feedback,
}: {
  label: string;
  children: ReactNode;
  feedback?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <dt className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase">
        {label}
      </dt>

      <dd className="border-surface-highest bg-surface text-foreground m-0 flex min-h-10 min-w-0 items-center rounded-md border px-2 py-2 text-xs leading-[18px] font-medium break-words">
        {children}
      </dd>
      {feedback}
    </div>
  );
}

function PersonValue({ name, fallback }: { name: string | null; fallback: string }) {
  if (!name) {
    return <span className="text-foreground-muted">{fallback}</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-surface-nested text-foreground-muted flex size-6 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold"
      >
        {getInitials(name)}
      </span>

      <span className="min-w-0 font-semibold break-words">{name}</span>
    </span>
  );
}

type AttributeOptions = {
  members: ReturnType<typeof useProjectMembers>;
  epics: ReturnType<typeof useTaskEpics>;
};

type TaskEditor = ReturnType<typeof useTaskUpdates>;

function TaskAttributes({
  task,
  editor,
  options,
}: {
  task: TaskDetails;
  editor: TaskEditor;
  options: AttributeOptions;
}) {
  const knownStatus = TASK_STATUSES.find((item) => item.value === task.status);

  const epicText = task.epic
    ? [task.epic.code ? `(${task.epic.code})` : null, task.epic.title].filter(Boolean).join(' ') ||
      task.epic.id
    : 'No epic';
  const selectClassName =
    'text-foreground focus-visible:ring-primary w-full min-w-0 rounded-sm bg-transparent text-xs outline-none focus-visible:ring-2 disabled:opacity-60';
  const disabled = (field: 'status' | 'assignee_id' | 'epic_id' | 'due_date') =>
    Boolean(editor.saving[field]) || editor.isClosing;
  const feedback = (field: 'status' | 'assignee_id' | 'epic_id' | 'due_date') => (
    <>
      {editor.saving[field] && (
        <p role="status" className="text-foreground-muted text-xs">
          Saving...
        </p>
      )}
      {editor.errors[field] && (
        <p role="alert" className="text-error text-xs">
          {editor.errors[field]}
        </p>
      )}
    </>
  );

  return (
    <dl className="flex flex-col gap-5">
      <DetailField label="Status" feedback={feedback('status')}>
        {task.canEdit ? (
          <select
            aria-label="Task status"
            value={editor.status}
            disabled={disabled('status')}
            aria-busy={Boolean(editor.saving.status)}
            aria-invalid={Boolean(editor.errors.status)}
            onChange={(event) => void editor.save('status', event.target.value)}
            className={selectClassName}
          >
            {!TASK_STATUSES.some((status) => status.value === editor.status) && (
              <option value={editor.status} disabled>
                {editor.status.replaceAll('_', ' ')}
              </option>
            )}
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="bg-surface-nested text-foreground inline-flex rounded-xs px-2 py-1 font-semibold">
            {knownStatus?.label ?? task.status.replaceAll('_', ' ')}
          </span>
        )}
      </DetailField>

      <DetailField
        label="Assignee"
        feedback={
          <>
            {feedback('assignee_id')}
            {task.canEdit && options.members.status !== 'success' && (
              <p role="status" className="text-foreground-muted text-xs">
                {options.members.status === 'loading' ? (
                  'Loading members...'
                ) : (
                  <button type="button" onClick={options.members.retry} className="text-primary">
                    Unable to load members. Retry
                  </button>
                )}
              </p>
            )}
          </>
        }
      >
        {task.canEdit ? (
          <select
            aria-label="Task assignee"
            value={editor.assigneeId}
            disabled={disabled('assignee_id') || options.members.status !== 'success'}
            aria-busy={options.members.status === 'loading' || Boolean(editor.saving.assignee_id)}
            aria-invalid={Boolean(editor.errors.assignee_id)}
            onChange={(event) => void editor.save('assignee_id', event.target.value)}
            className={selectClassName}
          >
            <option value="">Unassigned</option>
            {editor.assigneeId &&
              !options.members.members.some((member) => member.userId === editor.assigneeId) && (
                <option value={editor.assigneeId} disabled>
                  {editor.assigneeId === task.assigneeId
                    ? (task.assigneeName ?? 'Unavailable member')
                    : 'Unavailable member'}{' '}
                  (unavailable)
                </option>
              )}
            {options.members.members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
        ) : (
          <PersonValue name={task.assigneeName} fallback="Unassigned" />
        )}
      </DetailField>

      <DetailField
        label="Epic"
        feedback={
          <>
            {feedback('epic_id')}
            {task.canEdit && options.epics.status !== 'success' && (
              <p role="status" className="text-foreground-muted text-xs">
                {options.epics.status === 'loading' ? (
                  'Loading epics...'
                ) : (
                  <button type="button" onClick={options.epics.retry} className="text-primary">
                    Unable to load epics. Retry
                  </button>
                )}
              </p>
            )}
          </>
        }
      >
        {task.canEdit ? (
          <select
            aria-label="Task epic"
            value={editor.epicId}
            disabled={disabled('epic_id') || options.epics.status !== 'success'}
            aria-busy={options.epics.status === 'loading' || Boolean(editor.saving.epic_id)}
            aria-invalid={Boolean(editor.errors.epic_id)}
            onChange={(event) => void editor.save('epic_id', event.target.value)}
            className={selectClassName}
          >
            <option value="">No Epic</option>
            {editor.epicId && !options.epics.epics.some((epic) => epic.id === editor.epicId) && (
              <option value={editor.epicId} disabled>
                {editor.epicId === task.epic?.id ? epicText : 'Unavailable epic'} (unavailable)
              </option>
            )}
            {options.epics.epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.epicId} {epic.title}
              </option>
            ))}
          </select>
        ) : (
          epicText
        )}
      </DetailField>

      <DetailField label="Due Date" feedback={feedback('due_date')}>
        {task.canEdit ? (
          <span className="flex w-full min-w-0 items-center gap-2">
            <DateIcon aria-hidden="true" className="shrink-0" />
            <Input
              type="date"
              aria-label="Task due date"
              value={editor.dueDate}
              min={new Date().toISOString().slice(0, 10)}
              disabled={disabled('due_date')}
              aria-busy={Boolean(editor.saving.due_date)}
              aria-invalid={Boolean(editor.errors.due_date)}
              onChange={(event) => void editor.save('due_date', event.target.value)}
              className="focus-visible:ring-primary min-w-0 flex-1 bg-transparent px-0 text-xs focus-visible:ring-2 disabled:opacity-60"
            />
            {editor.dueDate && (
              <button
                type="button"
                aria-label="Clear task due date"
                disabled={disabled('due_date')}
                onClick={() => void editor.save('due_date', '')}
                className="text-primary shrink-0 text-xs disabled:opacity-60"
              >
                Clear
              </button>
            )}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <DateIcon aria-hidden="true" className="shrink-0" />
            {task.dueDate ? <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> : 'â€”'}
          </span>
        )}
      </DetailField>

      <DetailField label="Created By">
        <PersonValue name={task.createdByName} fallback="Unknown creator" />
      </DetailField>

      <DetailField label="Created At">
        <span className="flex items-center gap-2">
          <DateIcon aria-hidden="true" className="shrink-0" />
          {task.createdAt ? (
            <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time>
          ) : (
            'â€”'
          )}
        </span>
      </DetailField>
    </dl>
  );
}

function TaskContent({
  task,
  editor,
  options,
}: {
  task: TaskDetails;
  editor: TaskEditor;
  options: AttributeOptions;
}) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <FieldLabel
          htmlFor={task.canEdit ? 'task-details-title' : undefined}
          className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase"
        >
          Title
        </FieldLabel>

        {task.canEdit ? (
          <Input
            id="task-details-title"
            value={editor.title}
            disabled={Boolean(editor.saving.title) || editor.isClosing}
            aria-busy={Boolean(editor.saving.title)}
            aria-invalid={Boolean(editor.errors.title)}
            aria-describedby={
              editor.errors.title
                ? 'task-title-error'
                : editor.saving.title
                  ? 'task-title-saving'
                  : undefined
            }
            onChange={(event) => editor.change('title', event.target.value)}
            onBlur={() => void editor.save('title')}
            className="border-surface-highest bg-surface text-foreground focus-visible:ring-primary min-h-[54px] rounded-[12px] border p-3 text-sm leading-[21px] font-semibold focus-visible:ring-2 disabled:opacity-60"
          />
        ) : (
          <div className="border-surface-highest bg-surface text-foreground flex min-h-[54px] items-center rounded-[12px] border p-3 text-sm leading-[21px] font-semibold break-words">
            {task.title}
          </div>
        )}
        {editor.saving.title && (
          <p id="task-title-saving" role="status" className="text-foreground-muted text-xs">
            Saving title...
          </p>
        )}
        {editor.errors.title && (
          <p id="task-title-error" role="alert" className="text-error text-xs">
            {editor.errors.title}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <FieldLabel
          htmlFor={task.canEdit ? 'task-details-description' : undefined}
          className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase"
        >
          Description
        </FieldLabel>

        {task.canEdit ? (
          <Textarea
            id="task-details-description"
            value={editor.description}
            placeholder="No description provided."
            disabled={Boolean(editor.saving.description) || editor.isClosing}
            aria-busy={Boolean(editor.saving.description)}
            aria-invalid={Boolean(editor.errors.description)}
            aria-describedby={
              editor.errors.description
                ? 'task-description-error'
                : editor.saving.description
                  ? 'task-description-saving'
                  : undefined
            }
            onChange={(event) => editor.change('description', event.target.value)}
            onBlur={() => void editor.save('description')}
            className="border-surface-highest bg-surface text-foreground placeholder:text-foreground-muted focus-visible:ring-primary min-h-[160px] rounded-[12px] border p-3 text-sm leading-[21px] break-words whitespace-pre-wrap focus-visible:ring-2 disabled:opacity-60 md:min-h-[472px]"
          />
        ) : (
          <div className="border-surface-highest bg-surface text-foreground min-h-[160px] rounded-[12px] border p-3 text-sm leading-[21px] break-words whitespace-pre-wrap md:min-h-[472px]">
            {task.description || (
              <span className="text-foreground-muted">No description provided.</span>
            )}
          </div>
        )}
        {editor.saving.description && (
          <p id="task-description-saving" role="status" className="text-foreground-muted text-xs">
            Saving description...
          </p>
        )}
        {editor.errors.description && (
          <p id="task-description-error" role="alert" className="text-error text-xs">
            {editor.errors.description}
          </p>
        )}
      </div>

      <div className="mt-6 md:hidden">
        <TaskAttributes task={task} editor={editor} options={options} />
      </div>
    </>
  );
}

function TaskDetailsDialogContent({ projectId, taskId, onClose, onUpdated }: DialogContentProps) {
  const { task, status, retry } = useTaskDetails(projectId, taskId);
  const editor = useTaskUpdates(task, onUpdated);
  const members = useProjectMembers(projectId, Boolean(task?.canEdit));
  const epics = useTaskEpics(projectId, Boolean(task?.canEdit));
  const options = { members, epics };
  const requestClose = () => void editor.close(onClose);

  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = requestClose;
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const dialog = dialogRef.current;

      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (
        event.target instanceof Node &&
        dialogRef.current &&
        !dialogRef.current.contains(event.target)
      ) {
        dialogRef.current.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);

      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close task details"
        onClick={requestClose}
        className="bg-foreground/40 absolute inset-0 cursor-default backdrop-blur-[2px]"
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-dialog-title"
        tabIndex={-1}
        className="bg-surface-low md:bg-surface relative z-10 flex h-[91dvh] max-h-[calc(100dvh-12px)] w-full flex-col overflow-hidden rounded-t-[24px] shadow-[0_-4px_12px_rgba(4,27,60,0.06)] md:h-[870px] md:max-h-[calc(100dvh-48px)] md:max-w-[896px] md:flex-row md:rounded-md md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <h2 id="task-details-dialog-title" className="sr-only">
          Task Details
        </h2>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-surface-icon flex shrink-0 flex-col gap-4 border-b px-4 pt-4 pb-4 md:px-8 md:pt-6">
            <div
              aria-hidden="true"
              className="bg-outline/30 mx-auto h-1 w-10 rounded-full md:hidden"
            />

            <div className="flex items-center justify-between gap-3">
              <span className="bg-surface-nested text-primary inline-flex max-w-full truncate rounded-xs px-2 py-1 text-xs leading-4 font-bold tracking-[1px]">
                {task?.taskCode ?? 'Task Details'}
              </span>

              <button
                type="button"
                onClick={requestClose}
                aria-label="Close task details"
                className="flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] md:hidden"
              >
                <CloseIcon aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-8 md:py-6">
            {status === 'loading' && (
              <div
                role="status"
                aria-label="Loading task details"
                className="animate-pulse space-y-6"
              >
                <div className="space-y-3">
                  <div className="bg-surface-highest h-4 w-16 rounded" />
                  <div className="bg-surface-highest h-[54px] rounded-[12px]" />
                </div>

                <div className="space-y-3">
                  <div className="bg-surface-highest h-4 w-24 rounded" />
                  <div className="bg-surface-highest h-40 rounded-[12px] md:h-[472px]" />
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-start gap-4 py-6">
                <p role="alert" className="text-error text-sm">
                  Failed to load task details
                </p>

                <Button onClick={retry}>Retry</Button>
              </div>
            )}

            {status === 'not-found' && (
              <p role="status" className="text-foreground-muted py-6 text-sm">
                Task not found
              </p>
            )}

            {status === 'success' && task && (
              <TaskContent task={task} editor={editor} options={options} />
            )}
          </div>

          <footer className="bg-surface-low hidden shrink-0 px-8 py-4 md:flex">
            <button
              type="button"
              onClick={requestClose}
              className="bg-surface-highest text-foreground cursor-pointer rounded-sm px-4 py-2 text-sm font-semibold"
            >
              Close
            </button>
          </footer>
        </div>

        <aside
          aria-label="Task attributes"
          className="border-surface-icon bg-surface-low hidden w-[320px] shrink-0 overflow-y-auto border-l p-8 md:block"
        >
          {status === 'success' && task && (
            <TaskAttributes task={task} editor={editor} options={options} />
          )}

          {status === 'loading' && (
            <div aria-hidden="true" className="animate-pulse space-y-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-3">
                  <div className="bg-surface-highest h-4 w-20 rounded" />
                  <div className="bg-surface-highest h-10 rounded-md" />
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>,
    document.body,
  );
}

export function TaskDetailsDialog({
  projectId,
  taskId,
  onClose,
  onUpdated,
}: TaskDetailsDialogProps) {
  if (!projectId || !taskId || typeof document === 'undefined') {
    return null;
  }

  return (
    <TaskDetailsDialogContent
      key={`${projectId}:${taskId}`}
      projectId={projectId}
      taskId={taskId}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}
