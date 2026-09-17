import Link from 'next/link';

import EmptyBottomIcon from '@/assets/icons/projects/empty-bottom.svg';
import EmptyCenterIcon from '@/assets/icons/projects/empty-center.svg';
import EmptyTopIcon from '@/assets/icons/projects/empty-top.svg';

export function ProjectsEmptyState() {
  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-6 py-12 text-center lg:min-h-[calc(100dvh-4rem)]">
      <div className="bg-surface-low relative flex size-[220px] items-center justify-center overflow-hidden rounded-md sm:size-[288px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="bg-surface absolute top-8 right-8 flex size-10 rotate-[-6deg] items-center justify-center rounded-sm shadow-sm sm:size-12">
          <EmptyTopIcon aria-hidden="true" className="size-5" />
        </div>

        <div className="bg-surface absolute bottom-9 left-8 flex size-9 rotate-12 items-center justify-center rounded-sm shadow-sm sm:size-10">
          <EmptyBottomIcon aria-hidden="true" className="size-[18px]" />
        </div>

        <div className="bg-surface-highest relative flex size-20 items-center justify-center rounded-[12px] shadow-lg sm:size-24">
          <EmptyCenterIcon aria-hidden="true" className="h-[42px] w-[25px]" />
        </div>
      </div>

      <div className="mt-10 flex max-w-md flex-col items-center gap-4">
        <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px] sm:text-[36px] sm:leading-10">
          No Projects
        </h1>

        <p className="text-foreground-secondary text-base leading-6 sm:text-lg sm:leading-[29px]">
          You don’t have any projects yet. Start by defining your first architectural workspace to
          begin tracking tasks and epics.
        </p>
      </div>

      <Link
        href="/project/add"
        className="text-on-primary mt-10 inline-flex min-h-12 items-center justify-center rounded-sm bg-[linear-gradient(165deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-8 text-base font-bold shadow-sm sm:min-h-14 sm:text-lg"
      >
        Create New Project
      </Link>
    </section>
  );
}
