import Link from 'next/link';

import EpicsIcon from '@/assets/icons/navigation/epics.svg';
import MembersIcon from '@/assets/icons/navigation/members.svg';
import TasksIcon from '@/assets/icons/navigation/tasks.svg';
import type { Project } from '../types/project';
import { formatProjectDate } from '../utils/format-project-date';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/project/${project.id}/epics`}
      aria-label={`Open project ${project.name}`}
      className="bg-surface focus-visible:outline-primary flex min-h-[220px] min-w-0 flex-col gap-4 rounded-md p-6 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-foreground truncate text-lg leading-7 font-medium">{project.name}</h2>

        <p className="text-foreground-secondary line-clamp-3 min-h-[68px] text-sm leading-[22.75px]">
          {project.description ?? ''}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="text-primary flex items-center gap-1">
            <EpicsIcon aria-hidden="true" className="h-[18px] w-5 [&_path]:fill-current" />

            <span className="text-[10px] leading-[15px] font-semibold">Epics</span>
          </div>

          <div className="text-primary flex items-center gap-0.5">
            <TasksIcon aria-hidden="true" className="h-[15px] w-5 [&_path]:fill-current" />

            <span className="text-[10px] leading-[15px] font-semibold">Tasks</span>
          </div>

          <div className="text-primary flex items-center gap-0.5">
            <MembersIcon aria-hidden="true" className="h-4 w-[22px] [&_path]:fill-current" />

            <span className="text-[10px] leading-[15px] font-semibold">Members</span>
          </div>
        </div>
      </div>

      <div className="border-outline/10 flex items-center justify-between border-t pt-[17px]">
        <span className="text-foreground-subtle text-[11px] leading-[16.5px] font-bold tracking-[-0.55px] uppercase">
          Created At
        </span>

        <time
          dateTime={project.createdAt}
          className="text-foreground-secondary text-sm leading-5 font-medium"
        >
          {formatProjectDate(project.createdAt)}
        </time>
      </div>
    </Link>
  );
}
