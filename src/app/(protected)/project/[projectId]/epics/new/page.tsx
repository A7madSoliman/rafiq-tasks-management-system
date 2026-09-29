import { CreateEpicForm } from '@/features/epics/components/create-epic-form';

type CreateEpicPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function CreateEpicPage({ params }: CreateEpicPageProps) {
  const { projectId } = await params;

  return <CreateEpicForm projectId={projectId} />;
}
