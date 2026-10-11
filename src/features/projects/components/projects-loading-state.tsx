function Skeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-icon animate-pulse motion-reduce:animate-none ${className}`}
    />
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-surface flex min-h-[220px] min-w-0 flex-col gap-4 rounded-md p-6">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-7 w-2/3 rounded-sm" />
        <div className="flex flex-col gap-2 pt-1">
          <Skeleton className="h-4 w-full rounded-xs" />
          <Skeleton className="h-4 w-4/5 rounded-xs" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-12 max-w-[22%] rounded-xs" />
          ))}
        </div>
      </div>
      <div className="border-outline/10 flex items-center justify-between border-t pt-[17px]">
        <Skeleton className="h-4 w-20 rounded-xs" />
        <Skeleton className="h-5 w-24 rounded-xs" />
      </div>
    </div>
  );
}

export function ProjectsLoadingState() {
  return (
    <section role="status" aria-label="Loading projects" className="w-full px-6 py-6 lg:px-8 lg:py-8">
      <span className="sr-only">Loading projects...</span>
      <div className="flex w-full flex-col gap-6 lg:gap-10">
        <div className="flex items-end justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-8 w-36 rounded-sm lg:h-9 lg:w-40" />
            <Skeleton className="h-5 w-64 max-w-full rounded-xs" />
          </div>
          <Skeleton className="hidden h-12 w-[209px] shrink-0 rounded-xs lg:block" />
        </div>

        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {Array.from({ length: 5 }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
          <div aria-hidden="true" className="border-outline/20 hidden min-h-[220px] items-center justify-center rounded-md border-2 border-dashed lg:flex">
            <Skeleton className="size-12 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}
