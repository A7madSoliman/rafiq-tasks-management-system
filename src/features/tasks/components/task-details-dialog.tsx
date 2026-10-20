'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@/assets/icons/navigation/close.svg';
import DateIcon from '@/assets/icons/epics/details/date.svg';
import { Button } from '@/components/ui/button';
import { TASK_STATUSES } from '../constants/task-statuses';
import { useTaskDetails } from '../hooks/use-task-details';
import type { TaskDetails } from '../schemas/task-details-schema';

type TaskDetailsDialogProps = {
  projectId: string;
  taskId: string | null;
  onClose: () => void;
};

type DialogContentProps = {
  projectId: string;
  taskId: string;
  onClose: () => void;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <dt className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase">
        {label}
      </dt>

      <dd className="border-surface-highest bg-surface text-foreground m-0 flex min-h-10 min-w-0 items-center rounded-md border px-2 py-2 text-xs leading-[18px] font-medium break-words">
        {children}
      </dd>
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

function TaskAttributes({ task }: { task: TaskDetails }) {
  const knownStatus = TASK_STATUSES.find((item) => item.value === task.status);

  const epicText = task.epic
    ? [task.epic.code ? `(${task.epic.code})` : null, task.epic.title].filter(Boolean).join(' ') ||
      task.epic.id
    : 'No epic';

  return (
    <dl className="flex flex-col gap-5">
      <DetailField label="Status">
        <span className="bg-surface-nested text-foreground inline-flex rounded-xs px-2 py-1 font-semibold">
          {knownStatus?.label ?? task.status.replaceAll('_', ' ')}
        </span>
      </DetailField>

      <DetailField label="Assignee">
        <PersonValue name={task.assigneeName} fallback="Unassigned" />
      </DetailField>

      <DetailField label="Epic">{epicText}</DetailField>

      <DetailField label="Due Date">
        <span className="flex items-center gap-2">
          <DateIcon aria-hidden="true" className="shrink-0" />
          {task.dueDate ? <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> : '—'}
        </span>
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
            '—'
          )}
        </span>
      </DetailField>
    </dl>
  );
}

function TaskContent({ task }: { task: TaskDetails }) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase">
          Title
        </h3>

        <div className="border-surface-highest bg-surface text-foreground flex min-h-[54px] items-center rounded-[12px] border p-3 text-sm leading-[21px] font-semibold break-words">
          {task.title}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <h3 className="text-foreground-secondary text-xs font-bold tracking-[0.5px] uppercase">
          Description
        </h3>

        <div className="border-surface-highest bg-surface text-foreground min-h-[160px] rounded-[12px] border p-3 text-sm leading-[21px] break-words whitespace-pre-wrap md:min-h-[472px]">
          {task.description || (
            <span className="text-foreground-muted">No description provided.</span>
          )}
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <TaskAttributes task={task} />
      </div>
    </>
  );
}

function TaskDetailsDialogContent({ projectId, taskId, onClose }: DialogContentProps) {
  const { task, status, retry } = useTaskDetails(projectId, taskId);

  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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
        onClick={onClose}
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
                onClick={onClose}
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

            {status === 'success' && task && <TaskContent task={task} />}
          </div>

          <footer className="bg-surface-low hidden shrink-0 px-8 py-4 md:flex">
            <button
              type="button"
              onClick={onClose}
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
          {status === 'success' && task && <TaskAttributes task={task} />}

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

export function TaskDetailsDialog({ projectId, taskId, onClose }: TaskDetailsDialogProps) {
  if (!projectId || !taskId || typeof document === 'undefined') {
    return null;
  }

  return (
    <TaskDetailsDialogContent
      key={`${projectId}:${taskId}`}
      projectId={projectId}
      taskId={taskId}
      onClose={onClose}
    />
  );
}
