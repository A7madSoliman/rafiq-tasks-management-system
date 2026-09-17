import NextIcon from '@/assets/icons/projects/pagination-next.svg';
import PreviousIcon from '@/assets/icons/projects/pagination-previous.svg';
import { cn } from '@/lib/cn';

const paginationItems = [1, 2, 3, 'ellipsis', 15] as const;

export function ProjectsPagination() {
  return (
    <nav
      aria-label="Projects pagination"
      className="flex w-full justify-center px-6 py-8 lg:justify-end lg:px-8"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          className="border-outline/30 flex size-8 items-center justify-center rounded-xs border"
        >
          <PreviousIcon aria-hidden="true" className="h-[7px] w-[5px]" />
        </button>

        {paginationItems.map((item) => {
          const isCurrentPage = item === 1;

          return (
            <button
              key={item}
              type="button"
              aria-current={isCurrentPage ? 'page' : undefined}
              aria-label={item === 'ellipsis' ? 'More pages' : `Page ${item}`}
              className={cn(
                'text-foreground-secondary border-outline/30 flex size-8 items-center justify-center rounded-xs border text-xs font-bold',
                isCurrentPage && 'bg-primary text-on-primary',
              )}
            >
              {item === 'ellipsis' ? '...' : item}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          className="border-outline/30 flex size-8 items-center justify-center rounded-xs border"
        >
          <NextIcon aria-hidden="true" className="h-[7px] w-[5px]" />
        </button>
      </div>
    </nav>
  );
}
