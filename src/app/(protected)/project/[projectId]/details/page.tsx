type ProjectTasksPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function DetailsPage({ params }: ProjectTasksPageProps) {
  const { projectId } = await params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Details</h1>

      <p className="text-foreground-muted mt-2 text-sm">Project ID: {projectId}</p>
    </div>
  );
}
