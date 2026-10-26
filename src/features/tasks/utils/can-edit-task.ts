import type { ProjectMemberRole } from '@/features/projects/types/project-member';

type EditTaskPermissionParams = {
  userId: string;
  projectCreatedBy: string;
  memberRole: ProjectMemberRole | null;
};

export function canEditTask({
  userId,
  projectCreatedBy,
  memberRole,
}: EditTaskPermissionParams): boolean {
  if (memberRole === 'viewer') return false;
  if (userId === projectCreatedBy) return true;

  return memberRole === 'owner' || memberRole === 'admin' || memberRole === 'member';
}
