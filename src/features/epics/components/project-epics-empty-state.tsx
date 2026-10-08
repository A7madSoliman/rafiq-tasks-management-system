import Link from 'next/link';

import CreateFirstEpicIcon from '@/assets/icons/epics/empty-state/create-first-epic.svg';
import TileAddIcon from '@/assets/icons/epics/empty-state/tile-add.svg';
import TilePrimaryIcon from '@/assets/icons/epics/empty-state/tile-primary.svg';
import TileSecondaryIcon from '@/assets/icons/epics/empty-state/tile-secondary.svg';
import TileTertiaryIcon from '@/assets/icons/epics/empty-state/tile-tertiary.svg';

type ProjectEpicsEmptyStateProps = {
  newEpicHref: string;
};

export function ProjectEpicsEmptyState({ newEpicHref }: ProjectEpicsEmptyStateProps) {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] w-full items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[672px] flex-col items-center gap-[35px] text-center">
        <div className="relative flex w-full justify-center">
          <div
            aria-hidden="true"
            className="bg-surface-nested absolute top-[-32px] size-64 rounded-[12px] opacity-50 blur-[32px]"
          />

          <div className="bg-surface relative flex size-56 items-center justify-center rounded-[32px] border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,61,155,0.1)] backdrop-blur-[2px]">
            <div className="grid grid-cols-2 gap-3 p-6">
              <div className="bg-primary-container/20 flex size-16 items-center justify-center rounded-md">
                <TilePrimaryIcon aria-hidden="true" />
              </div>

              <div className="bg-surface-highest flex size-16 items-center justify-center rounded-md">
                <TileSecondaryIcon aria-hidden="true" />
              </div>

              <div className="bg-surface-highest flex size-16 items-center justify-center rounded-md">
                <TileTertiaryIcon aria-hidden="true" />
              </div>

              <div className="bg-primary/5 border-primary/20 flex size-16 items-center justify-center rounded-md border-2 border-dashed">
                <TileAddIcon aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px]">
          No epics found for this project
        </h1>

        <p className="text-foreground-secondary max-w-[448px] text-base leading-7 lg:text-lg lg:leading-[29.25px]">
          Break down your large project into manageable epics to track progress better and maintain
          architectural clarity.
        </p>

        <Link
          href={newEpicHref}
          className="text-on-primary flex items-center gap-3 rounded-sm bg-[linear-gradient(167deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-10 py-4 text-lg leading-7 font-bold shadow-[0_20px_25px_-5px_rgba(0,61,155,0.2),0_8px_10px_-6px_rgba(0,61,155,0.2)]"
        >
          <CreateFirstEpicIcon aria-hidden="true" />
          <span>Create First Epic</span>
        </Link>
      </div>
    </div>
  );
}
