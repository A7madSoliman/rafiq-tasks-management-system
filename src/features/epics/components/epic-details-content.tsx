'use client';

import type { ReactNode } from 'react';
import type { ProjectEpic } from '../types/project-epic';
import { formatEpicDetailsDate } from '../utils/format-epic-details-date';
import AddIcon from '@/assets/icons/epics/add.svg';
import DateIcon from '@/assets/icons/epics/details/date.svg';
import TasksEmptyIcon from '@/assets/icons/epics/details/tasks-empty.svg';
import AddTaskIcon from '@/assets/icons/epics/details/add-task.svg';
import { Button } from '@/components/ui/button';

type EpicDetailsContentProps = {
  epic: ProjectEpic;
  onAddTask: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  isSaving: boolean;
};

type EpicMetaItemProps = {
  label: string;
  children: ReactNode;
};

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || '—';
}

function EpicMetaItem({ label, children }: EpicMetaItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 md:gap-2">
      <p className="text-foreground/40 text-[10px] leading-[15px] font-bold uppercase">{label}</p>

      <div className="border-surface-highest flex min-h-9 items-center rounded-md border px-2 py-1 md:min-h-10 md:p-2">
        {children}
      </div>
    </div>
  );
}

function EpicUserValue({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-surface-highest text-foreground-muted flex size-6 shrink-0 items-center justify-center rounded-[12px] text-[10px] leading-[15px] font-bold"
      >
        {getInitials(name)}
      </span>

      <span className="text-foreground truncate text-xs leading-4 font-medium md:text-sm md:leading-5">
        {name}
      </span>
    </div>
  );
}

export function EpicDetailsContent({
  epic,
  onAddTask,
  description,
  onDescriptionChange,
  onDescriptionBlur,
  isSaving,
}: EpicDetailsContentProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-none md:gap-8 md:px-8 md:pt-8 md:pb-8">
      <div className="border-outline/50 md:border-surface-highest min-h-[80px] shrink-0 rounded-md border p-2 md:min-h-[150px] md:rounded-[12px] md:p-3">
        <textarea
          aria-label="Epic description"
          placeholder="No description provided"
          value={description}
          maxLength={500}
          disabled={isSaving}
          onChange={(event) => onDescriptionChange(event.target.value)}
          onBlur={onDescriptionBlur}
          className="text-foreground placeholder:text-foreground-muted min-h-[62px] w-full resize-none bg-transparent text-xs leading-[18px] outline-none md:min-h-[124px] md:text-base md:leading-[26px]"
        />
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
        <EpicMetaItem label="Assignee">
          {epic.assignee ? (
            <EpicUserValue name={epic.assignee.name} />
          ) : (
            <span className="text-foreground-muted text-sm leading-5 font-medium">Unassigned</span>
          )}
        </EpicMetaItem>

        <EpicMetaItem label="Deadline">
          <div className="flex min-w-0 items-center gap-2">
            <DateIcon aria-hidden="true" />

            <span className="text-foreground truncate text-xs leading-4 font-medium md:text-sm md:leading-5">
              {formatEpicDetailsDate(epic.deadline)}
            </span>
          </div>
        </EpicMetaItem>

        <EpicMetaItem label="Created By">
          <EpicUserValue name={epic.createdBy.name} />
        </EpicMetaItem>

        <EpicMetaItem label="Created At">
          <div className="flex min-w-0 items-center gap-2">
            <DateIcon aria-hidden="true" />

            <span className="text-foreground truncate text-xs leading-4 font-medium md:text-sm md:leading-5">
              {formatEpicDetailsDate(epic.createdAt)}
            </span>
          </div>
        </EpicMetaItem>
      </div>

      <section
        aria-labelledby="epic-tasks-heading"
        className="flex min-h-[150px] flex-1 flex-col gap-2 overflow-y-auto overscroll-contain md:min-h-0 md:flex-none md:gap-6 md:overflow-visible"
      >
        <div className="bg-surface sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 md:static">
          <h3
            id="epic-tasks-heading"
            className="text-foreground text-xs leading-5 font-semibold uppercase md:text-lg md:leading-7 md:normal-case"
          >
            Tasks
          </h3>

          <button
            type="button"
            onClick={onAddTask}
            className="text-primary flex min-h-9 shrink-0 items-center gap-1 px-2 py-1 text-xs leading-5 font-semibold md:px-3 md:py-1.5 md:text-sm"
          >
            <AddTaskIcon aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="bg-surface-low/50 border-outline/30 md:bg-surface-low flex min-h-[110px] min-w-0 flex-1 flex-col items-center justify-center rounded-md border-2 border-dashed px-3 py-3 text-center md:min-h-0 md:flex-none md:px-12 md:py-[50px]">
          <div
            aria-hidden="true"
            className="bg-surface-nested mb-2 flex size-10 items-center justify-center rounded-[12px] md:mb-4 md:size-12"
          >
            <TasksEmptyIcon />
          </div>

          <p className="text-foreground max-w-[190px] text-[11px] leading-4 font-medium md:max-w-none md:text-base md:leading-6">
            No tasks have been added to this epic yet
          </p>

          <Button
            type="button"
            onClick={onAddTask}
            className="mt-2 gap-2 py-2 text-xs md:mt-4 md:py-[10px] md:text-sm"
          >
            <AddIcon aria-hidden="true" />
            Add Task
          </Button>
        </div>
      </section>
    </div>
  );
}
