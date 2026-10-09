'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import DateIcon from '@/assets/icons/epics/details/date.svg';
import ChevronDownIcon from '@/assets/icons/forms/chevron-down.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TASK_STATUSES } from '../constants/task-statuses';
import { createTaskSchema, type CreateTaskFormValues } from '../schemas/create-task-schema';
import { useRef } from 'react';
import { useProjectMembers } from '@/features/projects/hooks/use-project-members';
import { useTaskEpics } from '../hooks/use-task-epics';

type CreateTaskFormProps = {
  projectId: string;
  onClose: () => void;
  initialEpicId?: string | null;
};

const selectClassName =
  'bg-surface border border-surface-highest text-foreground h-10 w-full appearance-none rounded-md px-2 pr-10 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary';

function SelectChevron() {
  return (
    <ChevronDownIcon
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
    />
  );
}

function formatDueDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatEpicTitle(title: string): string {
  return title.length > 100 ? `${title.slice(0, 97)}...` : title;
}
export function CreateTaskForm({ onClose, initialEpicId = null, projectId }: CreateTaskFormProps) {
  const { epics, status: epicsStatus, retry: retryEpics } = useTaskEpics(projectId);
  const { members, status: membersStatus, retry: retryMembers } = useProjectMembers(projectId);
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      status: 'TO_DO',
      assigneeId: '',
      epicId: initialEpicId ?? '',
      dueDate: '',
    },
  });

  const selectedDueDate = useWatch({
    control,
    name: 'dueDate',
  });

  const dueDateRegistration = register('dueDate');

  function openDatePicker() {
    const input = dueDateInputRef.current;

    if (!input) return;

    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => undefined)}
      className="flex h-full min-h-0 flex-col overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_320px] md:grid-rows-[auto_minmax(0,1fr)_auto] md:overflow-hidden"
    >
      {/* Title */}
      <div className="md:border-surface-icon flex flex-col gap-6 px-6 pt-5 pb-4 md:col-start-1 md:row-start-1 md:border-b md:px-8 md:pt-6 md:pb-6">
        <h2 className="text-foreground hidden text-xl leading-[30px] font-semibold md:block">
          Add New Task
        </h2>

        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="task-title">Title</FieldLabel>

          <Input
            id="task-title"
            placeholder="e.g., Finalize structural schematics"
            aria-required="true"
            aria-invalid={Boolean(errors.title)}
            className="bg-surface border-surface-highest h-[54px] rounded-[12px] border px-3 text-xs"
            {...register('title')}
          />

          {errors.title && (
            <p role="alert" className="text-error text-xs">
              {errors.title.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="flex min-h-0 flex-col px-6 pb-6 md:col-start-1 md:row-start-2 md:px-8 md:py-8">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <FieldLabel htmlFor="task-description">Description</FieldLabel>

          <Textarea
            id="task-description"
            placeholder="Provide detailed context for this task..."
            aria-invalid={Boolean(errors.description)}
            className="bg-surface border-surface-highest h-[188px] shrink-0 rounded-[12px] border p-3 text-xs leading-5 md:h-full md:min-h-0 md:flex-1"
            {...register('description')}
          />

          {errors.description && (
            <p role="alert" className="text-error text-xs">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Side attributes */}
      <aside className="bg-surface-low md:border-surface-icon flex flex-col gap-4 px-6 py-6 md:col-start-2 md:row-span-3 md:row-start-1 md:border-l md:px-8 md:py-8">
        {/* Status */}
        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="task-status">Status</FieldLabel>

          <div className="relative">
            <select
              id="task-status"
              className={selectClassName}
              aria-invalid={Boolean(errors.status)}
              {...register('status')}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <SelectChevron />
          </div>

          {errors.status && (
            <p role="alert" className="text-error text-xs">
              {errors.status.message}
            </p>
          )}
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="task-assignee">Assignee</FieldLabel>

          <div className="relative">
            <select
              id="task-assignee"
              className={selectClassName}
              aria-invalid={Boolean(errors.assigneeId)}
              aria-busy={membersStatus === 'loading'}
              {...register('assigneeId')}
            >
              <option value="">
                {membersStatus === 'loading'
                  ? 'Loading members...'
                  : membersStatus === 'error'
                    ? 'Unable to load members'
                    : members.length === 0
                      ? 'No members available'
                      : 'Select Team Member'}
              </option>

              {membersStatus === 'success' &&
                members.map((member) => (
                  <option key={member.id} value={member.userId}>
                    {member.name} — {member.email}
                  </option>
                ))}
            </select>

            <SelectChevron />
          </div>

          {membersStatus === 'error' && (
            <button
              type="button"
              onClick={retryMembers}
              className="text-primary w-fit cursor-pointer text-xs font-medium"
            >
              Retry loading members
            </button>
          )}

          {errors.assigneeId && (
            <p role="alert" className="text-error text-xs">
              {errors.assigneeId.message}
            </p>
          )}
        </div>

        {/* Epic */}
        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="task-epic">Epic</FieldLabel>

          <div className="relative">
            <select
              id="task-epic"
              className={selectClassName}
              disabled={epicsStatus !== 'success'}
              aria-busy={epicsStatus === 'loading'}
              aria-invalid={Boolean(errors.epicId)}
              {...register('epicId')}
            >
              <option value="">
                {epicsStatus === 'loading'
                  ? 'Loading epics...'
                  : epicsStatus === 'error'
                    ? 'Unable to load epics'
                    : epics.length === 0
                      ? 'No epics available'
                      : 'Select Epic'}
              </option>

              {epicsStatus === 'success' &&
                epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.epicId} {formatEpicTitle(epic.title)}
                  </option>
                ))}
            </select>

            <SelectChevron />
          </div>

          {epicsStatus === 'error' && (
            <button
              type="button"
              onClick={retryEpics}
              className="text-primary w-fit cursor-pointer text-xs font-medium"
            >
              Retry loading epics
            </button>
          )}

          {errors.epicId && (
            <p role="alert" className="text-error text-xs">
              {errors.epicId.message}
            </p>
          )}
        </div>

        {/* Due Date */}
        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="task-due-date-trigger">Due Date</FieldLabel>

          <div className="relative">
            <button
              id="task-due-date-trigger"
              type="button"
              onClick={openDatePicker}
              className="bg-surface border-surface-highest focus-visible:outline-primary flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border px-2 text-left focus-visible:outline-2"
            >
              <DateIcon aria-hidden="true" className="shrink-0" />

              <span
                className={
                  selectedDueDate
                    ? 'text-foreground flex-1 text-xs font-medium'
                    : 'text-foreground-subtle flex-1 text-xs font-medium'
                }
              >
                {selectedDueDate ? formatDueDate(selectedDueDate) : 'mm/dd/yyyy'}
              </span>

              <ChevronDownIcon aria-hidden="true" className="shrink-0" />
            </button>

            <input
              id="task-due-date"
              type="date"
              aria-label="Due Date"
              tabIndex={-1}
              aria-invalid={Boolean(errors.dueDate)}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
              {...dueDateRegistration}
              ref={(element) => {
                dueDateRegistration.ref(element);
                dueDateInputRef.current = element;
              }}
            />
          </div>

          {errors.dueDate && (
            <p id="task-due-date-error" role="alert" className="text-error text-xs">
              {errors.dueDate.message}
            </p>
          )}
        </div>
      </aside>

      {/* Actions */}
      <footer className="md:bg-surface-low mt-auto flex items-center justify-end px-6 pt-3 pb-6 md:col-start-1 md:row-start-3 md:mt-0 md:justify-between md:px-8 md:py-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="bg-surface-highest text-foreground hidden h-9 cursor-pointer px-4 md:inline-flex"
        >
          Close
        </Button>

        <Button
          type="submit"
          disabled
          className="h-10 w-full cursor-pointer px-6 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          Add Task
        </Button>
      </footer>
    </form>
  );
}
