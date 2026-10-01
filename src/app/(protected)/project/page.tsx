'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PROJECTS_PAGE_SIZE } from '@/features/projects/constants/projects-pagination';
import { ProjectsEmptyState } from '@/features/projects/components/projects-empty-state';
import { ProjectsErrorState } from '@/features/projects/components/projects-error-state';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { ProjectsLoadingState } from '@/features/projects/components/projects-loading-state';
import { ProjectsPagination } from '@/features/projects/components/projects-pagination';
import { useProjects } from '@/features/projects/hooks/use-projects';

export default function ProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageFromUrl = Number(searchParams.get('page') ?? '1');

  const currentPage = Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;

  const { projects, totalCount, status, retry } = useProjects(currentPage);

  const totalPages = Math.ceil(totalCount / PROJECTS_PAGE_SIZE);

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
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <ProjectsList projects={projects} />

      <div className="mt-auto">
        <ProjectsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
