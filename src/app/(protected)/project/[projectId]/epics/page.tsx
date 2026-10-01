import { ProjectEpicsScreen } from '@/features/epics/components/project-epics-screen';

type ProjectEpicsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectEpicsPage({ params }: ProjectEpicsPageProps) {
  const { projectId } = await params;

  return <ProjectEpicsScreen projectId={projectId} />;
}
