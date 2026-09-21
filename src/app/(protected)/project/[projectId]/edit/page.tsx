import { EditProjectScreen } from '@/features/projects/components/edit-project-screen';

type EditProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { projectId } = await params;

  return <EditProjectScreen projectId={projectId} />;
}
