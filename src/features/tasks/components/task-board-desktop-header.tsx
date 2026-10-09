'use client';

import Link from 'next/link';

import BreadcrumbChevronIcon from '@/assets/icons/tasks/breadcrumb-chevron.svg';
import SearchIcon from '@/assets/icons/tasks/search.svg';
import { useCurrentProject } from '@/features/projects/context/current-project-context';

export function TaskBoardDesktopHeader() {
  const { project } = useCurrentProject();

  return (
    <header className="hidden flex-col gap-6 px-8 pt-8 pb-6 lg:flex">
      <nav
        aria-label="Breadcrumb"
        className="text-task-status-label flex items-center gap-2 text-[10px] leading-[15px] font-bold tracking-[1px] uppercase"
      >
        <Link href="/project" className="hover:text-primary">
          Projects
        </Link>

        <BreadcrumbChevronIcon aria-hidden="true" />

        <span className="max-w-[240px] truncate">{project?.name ?? 'Project'}</span>

        <BreadcrumbChevronIcon aria-hidden="true" />

        <span className="text-foreground">Tasks</span>
      </nav>

      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px]">
            Active Workboard
          </h1>

          <p className="text-task-status-label mt-1 text-sm leading-5">
            Curating {project?.name ?? 'this project'}&apos;s production pipeline and milestones.
          </p>
        </div>

        <label className="bg-surface-highest flex h-10 w-64 shrink-0 items-center gap-[14px] rounded-sm px-3">
          <SearchIcon aria-hidden="true" />

          <input
            type="search"
            readOnly
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="text-foreground placeholder:text-placeholder min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
    </header>
  );
}
