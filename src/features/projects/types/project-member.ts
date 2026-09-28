export type ProjectMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ProjectMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
};
