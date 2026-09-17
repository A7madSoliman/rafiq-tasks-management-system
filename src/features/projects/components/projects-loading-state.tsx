function ProjectCardSkeleton() {
  return (
    <div className="bg-surface border-outline/10 flex min-h-[220px] animate-pulse flex-col gap-4 rounded-md border p-6 shadow-sm">
      <div className="bg-surface-icon h-32 w-full rounded-sm" />

      <div className="bg-surface-icon h-6 w-3/5 rounded-xs" />

      <div className="bg-surface-icon h-4 w-2/5 rounded-xs" />
    </div>
  );
}

export function ProjectsLoadingState() {
  return (
    <section className="w-full px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-[30px] leading-9 font-semibold">Projects</h1>

            <p className="text-foreground-secondary text-base leading-6">
              Manage and curate your projects
            </p>
          </div>

          <div
            aria-hidden="true"
            className="bg-surface-icon h-10 w-full animate-pulse rounded-xs sm:w-[209px]"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
