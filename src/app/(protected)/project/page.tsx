'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectsEmptyState } from '@/features/projects/components/projects-empty-state';
import { ProjectsErrorState } from '@/features/projects/components/projects-error-state';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { ProjectsLoadingState } from '@/features/projects/components/projects-loading-state';
import { ProjectsPagination } from '@/features/projects/components/projects-pagination';
import { PROJECTS_PAGE_SIZE } from '@/features/projects/constants/projects-pagination';
import { useProjects } from '@/features/projects/hooks/use-projects';

export default function ProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const pageFromUrl = Number(searchParams.get('page') ?? '1');

  const currentPage = Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;

  const { projects, totalCount, status, hasMore, isLoadingMore, loadMoreError, loadMore, retry } =
    useProjects(currentPage);

  const totalPages = Math.ceil(totalCount / PROJECTS_PAGE_SIZE);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore || loadMoreError) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isLoadingMore) {
          void loadMore();
        }
      },
      {
        rootMargin: '160px 0px',
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore, loadMoreError]);

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
      <ProjectsList projects={projects} />

      <div ref={loadMoreRef} aria-hidden="true" className="h-px md:hidden" />

      {isLoadingMore && (
        <div role="status" className="text-foreground-secondary py-6 text-center text-sm md:hidden">
          Loading more projects...
        </div>
      )}

      {loadMoreError && (
        <div role="alert" className="text-error py-6 text-center text-sm md:hidden">
          Failed to load more projects.
        </div>
      )}

      <ProjectsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
