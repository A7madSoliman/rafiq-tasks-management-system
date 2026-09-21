'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useProject } from '../hooks/use-project';
import type { ProjectDetails } from '../types/project';
import { getActiveProjectId } from '../utils/get-active-project-id';

type CurrentProjectStatus = 'idle' | 'loading' | 'success' | 'error';

type CurrentProjectContextValue = {
  projectId: string | null;
  project: ProjectDetails | null;
  status: CurrentProjectStatus;
  errorMessage: string | null;
  retry: () => void;
};

const CurrentProjectContext = createContext<CurrentProjectContextValue | null>(null);

const EMPTY_CURRENT_PROJECT: CurrentProjectContextValue = {
  projectId: null,
  project: null,
  status: 'idle',
  errorMessage: null,
  retry: () => undefined,
};

type CurrentProjectProviderProps = {
  children: ReactNode;
};

type ActiveCurrentProjectProviderProps = {
  projectId: string;
  children: ReactNode;
};

function ActiveCurrentProjectProvider({ projectId, children }: ActiveCurrentProjectProviderProps) {
  const { project, status, errorMessage, retry } = useProject(projectId);

  return (
    <CurrentProjectContext.Provider
      value={{
        projectId,
        project,
        status,
        errorMessage,
        retry,
      }}
    >
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function CurrentProjectProvider({ children }: CurrentProjectProviderProps) {
  const pathname = usePathname();
  const projectId = getActiveProjectId(pathname);

  if (!projectId) {
    return (
      <CurrentProjectContext.Provider value={EMPTY_CURRENT_PROJECT}>
        {children}
      </CurrentProjectContext.Provider>
    );
  }

  return (
    <ActiveCurrentProjectProvider key={projectId} projectId={projectId}>
      {children}
    </ActiveCurrentProjectProvider>
  );
}

export function useCurrentProject() {
  const context = useContext(CurrentProjectContext);

  if (!context) {
    throw new Error('useCurrentProject must be used within CurrentProjectProvider');
  }

  return context;
}
