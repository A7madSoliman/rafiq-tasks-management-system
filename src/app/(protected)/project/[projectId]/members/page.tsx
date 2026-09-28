import { ProjectMembersScreen } from '@/features/projects/components/project-members-screen';

type ProjectMembersPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectMembersPage({ params }: ProjectMembersPageProps) {
  const { projectId } = await params;

  return <ProjectMembersScreen projectId={projectId} />;
}
