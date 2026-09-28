'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCurrentProject } from '../context/current-project-context';
import { useProjectMembers } from '../hooks/use-project-members';
import { ProjectMembersList } from './project-members-list';
import InviteMemberIcon from '@/assets/icons/projects/invite-member.svg';
import { ProjectMembersLoadingState } from './project-members-loading-state';
import { ProjectMembersErrorState } from './project-members-error-state';

type ProjectMembersScreenProps = {
  projectId: string;
};

export function ProjectMembersScreen({ projectId }: ProjectMembersScreenProps) {
  const { project } = useCurrentProject();
  const { members, status, retry } = useProjectMembers(projectId);

  if (status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:px-8">
        <ProjectMembersLoadingState />
      </div>
    );
  }

  if (status === 'error') {
    return <ProjectMembersErrorState onRetry={retry} />;
  }
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:px-8">
      <header>
        <div className="hidden items-end justify-between lg:flex">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs leading-4 font-bold tracking-[1.2px] uppercase"
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

            <h1 className="text-foreground mt-4 text-[36px] leading-10 font-semibold tracking-[-0.9px]">
              Project Members
            </h1>
          </div>

          <Button type="button" className="px-6 py-3 text-sm leading-5 font-bold">
            Invite Member
          </Button>
        </div>

        <h1 className="text-foreground text-center text-[32px] leading-10 font-semibold tracking-[-0.9px] lg:hidden">
          Project Members
        </h1>
      </header>

      <div className="mt-8">
        {status === 'success' && members.length > 0 && (
          <>
            <ProjectMembersList members={members} />{' '}
            <div className="mt-8 flex justify-end lg:hidden">
              <button
                type="button"
                aria-label="Invite member"
                className="flex size-10 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] shadow-[0_10px_15px_-3px_rgba(0,61,155,0.2),0_4px_6px_-4px_rgba(0,61,155,0.2)]"
              >
                <InviteMemberIcon aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
