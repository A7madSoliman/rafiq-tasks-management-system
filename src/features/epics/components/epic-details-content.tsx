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
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-foreground/40 text-[10px] leading-[15px] font-bold uppercase">{label}</p>

      <div className="border-surface-highest flex min-h-10 items-center rounded-md border p-2">
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

      <span className="text-foreground truncate text-sm leading-5 font-medium">{name}</span>
    </div>
  );
}

export function EpicDetailsContent({ epic }: EpicDetailsContentProps) {
  return (
    <div className="flex flex-col gap-5 px-6 pt-4 pb-8 md:gap-8 md:px-8 md:pt-8">
      <div className="border-outline/50 md:border-surface-highest min-h-[110px] rounded-md border p-2 md:min-h-[150px] md:rounded-[12px] md:p-3">
        <p className="text-foreground-muted md:text-foreground text-sm leading-5 break-words md:text-base md:leading-[26px]">
          {epic.description?.trim() || 'No description provided'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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

            <span className="text-foreground truncate text-sm leading-5 font-medium">
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

            <span className="text-foreground truncate text-sm leading-5 font-medium">
              {formatEpicDetailsDate(epic.createdAt)}
            </span>
          </div>
        </EpicMetaItem>
      </div>

      <section aria-labelledby="epic-tasks-heading" className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <h3
            id="epic-tasks-heading"
            className="text-foreground text-sm leading-7 font-semibold uppercase md:text-lg md:normal-case"
          >
            Tasks
          </h3>

          <button
            type="button"
            className="text-primary flex shrink-0 items-center gap-1 px-3 py-1.5 text-sm leading-5 font-semibold"
          >
            <AddTaskIcon aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="bg-surface-low/50 border-outline/30 md:bg-surface-low flex flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 text-center md:px-12 md:py-[50px]">
          <div
            aria-hidden="true"
            className="bg-surface-nested mb-4 flex size-12 items-center justify-center rounded-[12px]"
          >
            <TasksEmptyIcon />
          </div>

          <p className="text-foreground max-w-[240px] text-sm leading-5 font-medium md:max-w-none md:text-base md:leading-6">
            No tasks have been added to this epic yet
          </p>

          <Button type="button" className="mt-4 gap-2 py-[10px]">
            <AddIcon aria-hidden="true" />
            Add New Task
          </Button>
        </div>
      </section>
    </div>
  );
}
