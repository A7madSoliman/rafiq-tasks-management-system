import Link from 'next/link';

import AddIcon from '@/assets/icons/projects/add.svg';
import AddProjectIcon from '@/assets/icons/projects/add-project.svg';
import type { Project } from '../types/project';
import { ProjectCard } from './project-card';

type ProjectsListProps = {
  desktopProjects: Project[];
  mobileProjects: Project[];
};

export function ProjectsList({ desktopProjects, mobileProjects }: ProjectsListProps) {
  return (
    <section className="w-full px-6 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 lg:gap-10">
        <div className="flex items-end justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-foreground text-2xl leading-8 font-bold tracking-[-0.6px] lg:text-[30px] lg:leading-9 lg:font-semibold lg:tracking-[-0.75px]">
              Projects
            </h1>

            <p className="text-foreground-secondary text-base leading-6">
              Manage and curate your projects
            </p>
          </div>

          <Link
            href="/project/add"
            className="text-on-primary hidden min-h-12 items-center justify-center rounded-xs bg-[linear-gradient(165deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-6 text-base font-medium shadow-sm lg:inline-flex"
          >
            Create New Project
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:hidden">
          {mobileProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <div className="hidden grid-cols-3 gap-6 lg:grid">
          {desktopProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          <Link
            href="/project/add"
            aria-label="Add project"
            className="bg-surface border-outline/20 flex min-h-[220px] items-center justify-center rounded-md border-2 border-dashed p-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="bg-surface-low flex size-12 items-center justify-center rounded-[12px]">
                <AddProjectIcon aria-hidden="true" className="size-5" />
              </div>

              <span className="text-foreground-secondary text-sm leading-5 font-bold tracking-[1.4px] uppercase">
                Add Project
              </span>
            </div>
          </Link>
        </div>
      </div>

      <Link
        href="/project/add"
        aria-label="Create new project"
        className="text-on-primary fixed right-6 bottom-20 z-30 flex size-14 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] shadow-lg lg:hidden"
      >
        <AddIcon aria-hidden="true" className="size-[14px]" />
      </Link>
    </section>
  );
}
