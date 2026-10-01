import type { ProjectEpic } from '../types/project-epic';
import { formatEpicDeadline } from '../utils/format-epic-deadline';
import CreatedByIcon from '@/assets/icons/epics/created-by.svg';
import DeadlineIcon from '@/assets/icons/epics/deadline.svg';

type ProjectEpicCardProps = {
  epic: ProjectEpic;
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function ProjectEpicCard({ epic }: ProjectEpicCardProps) {
  const assigneeName = epic.assignee?.name ?? 'Unassigned';
  const assigneeInitials = epic.assignee ? getInitials(epic.assignee.name) : '—';

  return (
    <article className="bg-surface border-primary flex min-h-[205px] flex-col rounded-md border-l-4 px-4 py-4 pl-5 shadow-sm lg:min-h-[209px]">
      <div className="pb-4">
        <span className="bg-surface-highest text-primary inline-flex rounded-[2px] px-[10px] py-1 text-[10px] leading-[15px] font-bold tracking-[0.5px]">
          {epic.epicId}
        </span>
      </div>
      <h2 className="text-foreground pb-3 text-xl leading-7 font-semibold">{epic.title}</h2>
      <div className="mt-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-on-primary flex size-10 shrink-0 items-center justify-center rounded-[12px] text-sm leading-5 font-bold">
            {assigneeInitials}
          </div>

          <div className="min-w-0">
            <p className="text-foreground-secondary text-xs leading-4 font-medium">Assignee</p>

            <p className="text-foreground truncate text-sm leading-5 font-semibold">
              {assigneeName}
            </p>
          </div>
        </div>

        <div className="border-surface-low flex items-center justify-between gap-4 border-t pt-4 text-[11px] leading-[16.5px]">
          <div className="flex min-w-0 items-center gap-2">
            <CreatedByIcon aria-hidden="true" className="shrink-0" />
            <p className="text-foreground-secondary min-w-0 truncate">
              Created by:
              <span className="text-foreground font-semibold">{epic.createdBy.name}</span>
            </p>
          </div>

          <div className="text-foreground-secondary flex shrink-0 items-center gap-2">
            <DeadlineIcon aria-hidden="true" className="shrink-0" />
            <span>{formatEpicDeadline(epic.deadline)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
