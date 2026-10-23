import { ProjectMembersScreen } from '@/features/projects/components/project-members-screen';
import { getAuthState } from '@/lib/auth/session';

type ProjectMembersPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectMembersPage({ params }: ProjectMembersPageProps) {
  const { projectId } = await params;

  const authState = await getAuthState();

  const currentUserId = authState.status === 'authenticated' ? authState.user.id : null;

  return <ProjectMembersScreen projectId={projectId} currentUserId={currentUserId} />;
}
