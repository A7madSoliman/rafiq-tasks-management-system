'use client';

import { Button } from '@/components/ui/button';

import { useProject } from '../hooks/use-project';

type EditProjectScreenProps = {
  projectId: string;
};

export function EditProjectScreen({ projectId }: EditProjectScreenProps) {
  const { project, status, errorMessage, retry } = useProject(projectId);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-6">
        <p className="text-foreground-muted text-sm">Loading project...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-error text-sm">
          {errorMessage}
        </p>

        <Button type="button" onClick={retry}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-foreground text-2xl font-semibold">Edit Project</h1>

      <p className="text-foreground-muted mt-2 text-sm">{project.name}</p>
    </div>
  );
}
