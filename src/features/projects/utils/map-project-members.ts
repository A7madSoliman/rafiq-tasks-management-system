import type { ProjectMember, ProjectMemberRole } from '../types/project-member';

const projectMemberRoles: ProjectMemberRole[] = ['owner', 'admin', 'member', 'viewer'];

function isProjectMemberRole(value: unknown): value is ProjectMemberRole {
  return typeof value === 'string' && projectMemberRoles.includes(value as ProjectMemberRole);
}

function mapProjectMember(value: unknown): ProjectMember | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('member_id' in value) ||
    typeof value.member_id !== 'string' ||
    !('user_id' in value) ||
    typeof value.user_id !== 'string' ||
    !('email' in value) ||
    typeof value.email !== 'string' ||
    !('role' in value) ||
    !isProjectMemberRole(value.role) ||
    !('metadata' in value) ||
    typeof value.metadata !== 'object' ||
    value.metadata === null ||
    !('name' in value.metadata) ||
    typeof value.metadata.name !== 'string'
  ) {
    return null;
  }

  return {
    id: value.member_id,
    userId: value.user_id,
    name: value.metadata.name,
    email: value.email,
    role: value.role,
  };
}

export function mapProjectMembers(value: unknown): ProjectMember[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const members = value.map(mapProjectMember);

  if (members.some((member) => member === null)) {
    return null;
  }

  return members as ProjectMember[];
}

export function isProjectMembers(value: unknown): value is ProjectMember[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every(
    (member) =>
      typeof member === 'object' &&
      member !== null &&
      'id' in member &&
      typeof member.id === 'string' &&
      'userId' in member &&
      typeof member.userId === 'string' &&
      'name' in member &&
      typeof member.name === 'string' &&
      'email' in member &&
      typeof member.email === 'string' &&
      'role' in member &&
      isProjectMemberRole(member.role),
  );
}
