import type { ProjectMemberRole } from '@/features/projects/types/project-member';

type CanInviteProjectMemberParams = {
  userId: string;
  projectCreatedBy: string;
  memberRole: ProjectMemberRole | null;
};

export function canInviteProjectMember({
  userId,
  projectCreatedBy,
  memberRole,
}: CanInviteProjectMemberParams): boolean {
  if (memberRole === 'viewer') {
    return false;
  }

  if (memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member') {
    return true;
  }

  return userId === projectCreatedBy;
}
