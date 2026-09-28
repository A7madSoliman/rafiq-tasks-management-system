import { cn } from '@/lib/cn';

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'from-surface-icon via-surface-low to-surface-icon animate-pulse bg-gradient-to-r',
        className,
      )}
    />
  );
}

function DesktopSkeletonRow() {
  return (
    <div className="grid grid-cols-[64px_1fr_160px] items-center px-4 py-6">
      <Skeleton className="size-10 rounded-[12px]" />

      <Skeleton className="h-5 w-48 rounded-xs" />

      <Skeleton className="h-4 w-40 rounded-xs" />
    </div>
  );
}

function MobileSkeletonCard() {
  return (
    <div className="bg-surface flex items-center justify-between gap-3 rounded-md p-4">
      <div className="flex min-w-0 items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-[12px]" />

        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-4 w-28 rounded-xs" />
          <Skeleton className="h-3 w-36 max-w-full rounded-xs" />
        </div>
      </div>

      <Skeleton className="h-[19px] w-14 shrink-0 rounded-full" />
    </div>
  );
}

export function ProjectMembersLoadingState() {
  return (
    <>
      <div className="hidden lg:block">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded-xs" />

              <span aria-hidden="true" className="text-outline text-xs leading-4">
                /
              </span>

              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-64 rounded-sm" />
              <Skeleton className="h-4 w-96 rounded-xs" />
            </div>
          </div>

          <Skeleton className="h-12 w-40 rounded-sm" />
        </div>

        <div className="mt-12 flex justify-center">
          <div className="bg-surface w-[599px] rounded-md px-6 pt-6 pb-4 shadow-sm">
            <div className="border-surface-icon/50 grid grid-cols-[64px_1fr_160px] border-b px-4 pb-[25px]">
              <Skeleton className="h-3 w-8 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
            </div>

            <div className="pb-8">
              {Array.from({ length: 5 }, (_, index) => (
                <DesktopSkeletonRow key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <Skeleton className="mx-auto h-10 w-64 max-w-full rounded-sm" />

        <div className="mt-3 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <MobileSkeletonCard key={index} />
          ))}
        </div>
      </div>
    </>
  );
}
