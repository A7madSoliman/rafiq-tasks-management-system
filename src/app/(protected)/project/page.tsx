'use client';

import { ProjectsEmptyState } from '@/features/projects/components/projects-empty-state';
import { ProjectsErrorState } from '@/features/projects/components/projects-error-state';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { ProjectsLoadingState } from '@/features/projects/components/projects-loading-state';
import { ProjectsPagination } from '@/features/projects/components/projects-pagination';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const DESKTOP_PROJECTS_PER_PAGE = 5;
const MOBILE_PROJECTS_BATCH_SIZE = 5;

export default function ProjectPage() {
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_PROJECTS_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { projects, status, retry } = useProjects();
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(projects.length / DESKTOP_PROJECTS_PER_PAGE);
  const pageFromUrl = Number(searchParams.get('page') ?? '1');
  const currentPage = Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * DESKTOP_PROJECTS_PER_PAGE;
  const endIndex = startIndex + DESKTOP_PROJECTS_PER_PAGE;
  const desktopProjects = projects.slice(startIndex, endIndex);
  const mobileProjects = projects.slice(0, mobileVisibleCount);
  const hasMoreMobileProjects = mobileVisibleCount < projects.length;

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMoreMobileProjects) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setMobileVisibleCount((current) =>
          Math.min(current + MOBILE_PROJECTS_BATCH_SIZE, projects.length),
        );
      },
      {
        rootMargin: '160px 0px',
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreMobileProjects, projects.length]);

  function handlePageChange(page: number) {
    router.push(`/project?page=${page}`);
  }

  if (status === 'loading') {
    return <ProjectsLoadingState />;
  }

  if (status === 'error') {
    return <ProjectsErrorState onRetry={retry} />;
  }

  if (projects.length === 0) {
    return <ProjectsEmptyState />;
  }
  return (
    <>
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
        <ProjectsList desktopProjects={desktopProjects} mobileProjects={mobileProjects} />

        {hasMoreMobileProjects && (
          <div ref={loadMoreRef} aria-hidden="true" className="h-1 lg:hidden" />
        )}
        <div className="mt-auto">
          <ProjectsPagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
}
