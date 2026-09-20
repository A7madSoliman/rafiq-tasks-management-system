'use client';

import { ProjectsEmptyState } from '@/features/projects/components/projects-empty-state';
import { ProjectsErrorState } from '@/features/projects/components/projects-error-state';
import { ProjectsList } from '@/features/projects/components/projects-list';
import { ProjectsLoadingState } from '@/features/projects/components/projects-loading-state';
import { ProjectsPagination } from '@/features/projects/components/projects-pagination';
import { useProjects } from '@/features/projects/hooks/use-projects';

export default function ProjectPage() {
  const { projects, status, retry } = useProjects();

  const PROJECTS_PER_PAGE = 8;
  const currentPage = 1;

  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const endIndex = startIndex + PROJECTS_PER_PAGE;

  const paginatedProjects = projects.slice(startIndex, endIndex);

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
        <ProjectsList projects={paginatedProjects} />
        <div className="mt-auto">
          <ProjectsPagination />
        </div>
      </div>
    </>
  );
}
