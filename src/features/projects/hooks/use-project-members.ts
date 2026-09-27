'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectMember } from '../types/project-member';
import { isProjectMembers, mapProjectMembers } from '../utils/map-project-members';

type ProjectMembersStatus = 'loading' | 'success' | 'error';

export function useProjectMembers(projectId: string) {
  const router = useRouter();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [status, setStatus] = useState<ProjectMembersStatus>('loading');

  const loadMembers = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/members`, {
          method: 'GET',
          signal,
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        const data: unknown = await response.json().catch(() => null);

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
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setStatus('error');
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadMembers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadMembers]);

  function retry() {
    setStatus('loading');
    void loadMembers();
  }

  return {
    members,
    status,
    retry,
  };
}
