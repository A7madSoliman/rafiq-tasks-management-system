import Link from 'next/link';

import EmptyBottomIcon from '@/assets/icons/projects/empty-bottom.svg';
import EmptyCenterIcon from '@/assets/icons/projects/empty-center.svg';
import EmptyTopIcon from '@/assets/icons/projects/empty-top.svg';
import EmptyProjectsGrid from '@/assets/icons/projects/empty-projects-grid.svg';

export function ProjectsEmptyState() {
  return (
    <section className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center gap-8 px-6 py-10 text-center lg:min-h-[calc(100dvh-4rem)] lg:gap-[43px] lg:px-0 lg:py-0">
      <div className="bg-surface-low relative flex size-[220px] items-center justify-center overflow-hidden rounded-md sm:size-[240px] lg:size-[288px]">
        <EmptyProjectsGrid aria-hidden="true" className="absolute inset-0 h-full w-full" />

        <div className="bg-surface absolute top-8 right-8 flex size-10 rotate-[-6deg] items-center justify-center rounded-sm shadow-sm lg:top-[38px] lg:right-[38px] lg:size-12">
          <EmptyTopIcon aria-hidden="true" className="size-5" />
        </div>

        <div className="bg-surface absolute bottom-9 left-8 flex size-9 rotate-12 items-center justify-center rounded-sm shadow-sm lg:bottom-[44px] lg:left-9 lg:size-10">
          <EmptyBottomIcon aria-hidden="true" className="size-[18px]" />
        </div>

        <div className="bg-surface-highest relative flex size-20 items-center justify-center rounded-[12px] shadow-lg lg:size-24">
          <EmptyCenterIcon aria-hidden="true" className="h-[42px] w-[25px]" />
        </div>
      </div>

      <div className="flex max-w-[448px] flex-col items-center gap-4">
        <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px] lg:text-[36px] lg:leading-10 lg:tracking-[-0.9px]">
          No Projects
        </h1>

        <p className="text-foreground-secondary text-base leading-6 lg:text-lg lg:leading-[29.25px]">
          You don’t have any projects yet. Start by defining your first architectural workspace to
          begin tracking tasks and epics.
        </p>
      </div>

      <Link
        href="/project/add"
        className="text-on-primary inline-flex items-center justify-center rounded-sm bg-[linear-gradient(165deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-8 py-4 text-lg leading-7 font-bold shadow-sm"
      >
        Create New Project
      </Link>
    </section>
  );
}
