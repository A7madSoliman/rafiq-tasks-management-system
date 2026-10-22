'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

import InviteMemberIcon from '@/assets/icons/projects/invite-member.svg';
import { Button } from '@/components/ui/button';

import { InviteMemberDialog } from '@/features/invitations/components/invite-member-dialog';

import { useCurrentProject } from '../context/current-project-context';
import { useProjectMembers } from '../hooks/use-project-members';
import { ProjectMembersList } from './project-members-list';
import { ProjectMembersLoadingState } from './project-members-loading-state';
import { ProjectMembersErrorState } from './project-members-error-state';

type ProjectMembersScreenProps = {
  projectId: string;
  currentUserId: string | null;
};

export function ProjectMembersScreen({ projectId, currentUserId }: ProjectMembersScreenProps) {
  const { project, status: projectStatus } = useCurrentProject();

  const { members, status, retry } = useProjectMembers(projectId);

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleOpenInvite = useCallback(() => {
    setIsInviteOpen(true);
  }, []);

  const handleCloseInvite = useCallback(() => {
    setIsInviteOpen(false);
  }, []);

  const currentMember = members.find((member) => member.userId === currentUserId);

  const canInvite =
    status === 'success' &&
    currentUserId !== null &&
    (currentMember?.role === 'owner' ||
      currentMember?.role === 'admin' ||
      currentMember?.role === 'member');

  if (status === 'loading' || projectStatus === 'loading') {
    return (
      <div className="w-full px-4 py-8 lg:px-8">
        <ProjectMembersLoadingState />
      </div>
    );
  }

  if (status === 'error') {
    return <ProjectMembersErrorState onRetry={retry} />;
  }

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      <header>
        <div className="hidden items-end justify-between lg:flex">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-task-status-label flex items-center gap-2 text-[10px] leading-[15px] font-bold tracking-[1px] uppercase"
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

              <span className="text-primary">Members</span>
            </nav>

            <h1 className="text-foreground mt-6 text-[30px] leading-9 font-semibold tracking-[-0.75px]">
              Project Members
            </h1>
          </div>

          {canInvite && (
            <Button
              type="button"
              onClick={handleOpenInvite}
              className="h-10 cursor-pointer px-6 py-2 text-sm leading-5 font-bold"
            >
              Invite Member
            </Button>
          )}
        </div>

        <h1 className="text-foreground text-center text-[32px] leading-10 font-semibold tracking-[-0.9px] lg:hidden">
          Project Members
        </h1>
      </header>

      <div className="mt-8">
        {status === 'success' && members.length > 0 && <ProjectMembersList members={members} />}

        {canInvite && (
          <div className="mt-8 flex justify-end lg:hidden">
            <button
              type="button"
              onClick={handleOpenInvite}
              aria-label="Invite member"
              className="flex size-10 cursor-pointer items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] shadow-[0_10px_15px_-3px_rgba(0,61,155,0.2),0_4px_6px_-4px_rgba(0,61,155,0.2)]"
            >
              <InviteMemberIcon aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {isInviteOpen && canInvite && (
        <InviteMemberDialog
          projectId={projectId}
          projectName={project?.name ?? 'project'}
          onClose={handleCloseInvite}
        />
      )}
    </div>
  );
}
