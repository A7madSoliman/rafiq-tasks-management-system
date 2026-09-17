type ProjectEpicsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectEpicsPage({ params }: ProjectEpicsPageProps) {
  const { projectId } = await params;

  return (
    <div className="p-6">
      <h1 className="text-foreground text-2xl font-semibold">Epics</h1>

      <p className="text-foreground-secondary mt-2 text-sm">Project ID: {projectId}</p>
    </div>
  );
}
