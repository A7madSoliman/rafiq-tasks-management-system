'use client';

import { Button } from '@/components/ui/button';
import { EditProjectForm } from './edit-project-form';
import { EditProjectLoadingState } from './edit-project-loading-state';
import { useCurrentProject } from '../context/current-project-context';

export function EditProjectScreen() {
  const { project, status, errorMessage, retry } = useCurrentProject();

  if (status === 'loading') {
    return <EditProjectLoadingState />;
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

  return <EditProjectForm key={project.id} project={project} />;
}
