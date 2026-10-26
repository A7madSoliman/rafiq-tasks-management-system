'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectMember } from '../types/project-member';
import { isProjectMembers } from '../utils/map-project-members';

type ProjectMembersStatus = 'loading' | 'success' | 'error';

export function useProjectMembers(projectId: string, enabled = true) {
  const router = useRouter();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [status, setStatus] = useState<ProjectMembersStatus>('loading');
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const loadMembers = useCallback(async () => {
    if (!enabled || !projectId) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    setStatus('loading');
    setLoadedProjectId(projectId);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/members`, {
        method: 'GET',
        signal,
      });
      if (signal.aborted) return;

      if (response.status === 401) {
        router.replace('/login');
        router.refresh();
        return;
      }

      const data: unknown = await response.json().catch(() => null);
      if (signal.aborted) return;

      if (!response.ok) {
        setStatus('error');
        return;
      }

      if (!isProjectMembers(data)) {
        setStatus('error');
        return;
      }

      setMembers(data);
      setStatus('success');
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setStatus('error');
    }
  }, [projectId, router, enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMembers();

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadMembers]);

  function retry() {
    void loadMembers();
  }

  return {
    members: enabled && loadedProjectId === projectId && status === 'success' ? members : [],
    status: enabled && loadedProjectId === projectId ? status : ('loading' as const),
    retry,
  };
}
