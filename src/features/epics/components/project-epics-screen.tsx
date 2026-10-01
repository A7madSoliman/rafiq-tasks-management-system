'use client';

import Link from 'next/link';
import { ProjectEpicsLoadingState } from './project-epics-loading-state';
import { ProjectEpicsEmptyState } from './project-epics-empty-state';
import AddIcon from '@/assets/icons/epics/add.svg';
import SearchIcon from '@/assets/icons/epics/search.svg';
import { useCurrentProject } from '@/features/projects/context/current-project-context';
import { useProjectEpics } from '../hooks/use-project-epics';
import { ProjectEpicCard } from './project-epic-card';
import { ProjectEpicsErrorState } from './project-epics-error-state';
import { ProjectEpicsPagination } from './project-epics-pagination';
import { useRouter, useSearchParams } from 'next/navigation';
import { EPICS_PAGE_SIZE } from '../constants/epics-pagination';

type ProjectEpicsScreenProps = {
  projectId: string;
};

export function ProjectEpicsScreen({ projectId }: ProjectEpicsScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageFromUrl = Number(searchParams.get('page') ?? '1');
  const currentPage = Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const { epics, totalCount, status, retry } = useProjectEpics(projectId, currentPage);
  const { project } = useCurrentProject();
  const newEpicHref = `/project/${encodeURIComponent(projectId)}/epics/new`;
  const hasEpics = status === 'success' && epics.length > 0;

  const totalPages = Math.ceil(totalCount / EPICS_PAGE_SIZE);

  function handlePageChange(page: number) {
    router.push(`/project/${encodeURIComponent(projectId)}/epics?page=${page}`);
  }

  if (status === 'loading') {
    return <ProjectEpicsLoadingState />;
  }

  if (status === 'error') {
    return <ProjectEpicsErrorState onRetry={retry} />;
  }

  if (status === 'success' && epics.length === 0) {
    return <ProjectEpicsEmptyState newEpicHref={newEpicHref} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:px-8">
      <div className="flex w-full flex-col gap-6 lg:gap-10">
        <div className="hidden items-end justify-between lg:flex">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs leading-4 font-bold tracking-[1.2px] uppercase"
            >
              <Link href="/project" className="text-foreground-secondary/60">
                Projects
              </Link>

              <span aria-hidden="true" className="text-foreground-secondary/60">
                ›
              </span>

              <span className="text-foreground-secondary/60">{project?.name ?? 'Project'}</span>

              <span aria-hidden="true" className="text-foreground-secondary/60">
                ›
              </span>

              <span className="text-primary">Epics</span>
            </nav>

            <h1 className="text-foreground mt-4 text-[36px] leading-10 font-semibold tracking-[-0.9px]">
              Project Epics
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <label className="bg-surface-highest flex h-12 w-[303px] items-center gap-3 rounded-xs px-3">
              <SearchIcon aria-hidden="true" />

              <input
                type="search"
                readOnly
                aria-label="Search epics"
                placeholder="Search epics..."
                className="text-foreground placeholder:text-foreground-subtle min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>

            <Link
              href={newEpicHref}
              className="text-on-primary flex h-12 items-center gap-2 rounded-sm bg-[linear-gradient(136deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-6 text-base leading-6 font-bold shadow-lg"
            >
              <AddIcon aria-hidden="true" />
              <span>New Epic</span>
            </Link>
          </div>
        </div>

        <label className="bg-surface-highest flex h-12 w-full items-center gap-3 rounded-xs px-3 lg:hidden">
          <SearchIcon aria-hidden="true" />

          <input
            type="search"
            readOnly
            aria-label="Search epics"
            placeholder="Search Epics..."
            className="text-foreground placeholder:text-foreground-subtle min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>

        {hasEpics ? (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
              {epics.map((epic) => (
                <ProjectEpicCard key={epic.id} epic={epic} />
              ))}
            </div>

            <ProjectEpicsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : null}
      </div>

      <Link
        href={newEpicHref}
        aria-label="Create new epic"
        className="text-on-primary fixed right-6 bottom-[99px] z-30 flex size-14 items-center justify-center rounded-[12px] bg-[linear-gradient(136deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] shadow-lg lg:hidden"
      >
        <AddIcon aria-hidden="true" />
      </Link>
    </div>
  );
}
