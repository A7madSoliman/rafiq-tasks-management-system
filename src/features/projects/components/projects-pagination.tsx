import NextIcon from '@/assets/icons/projects/pagination-next.svg';
import PreviousIcon from '@/assets/icons/projects/pagination-previous.svg';
import { cn } from '@/lib/cn';

import { getPaginationItems } from '../utils/get-pagination-items';

type ProjectsPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function ProjectsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ProjectsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav aria-label="Projects pagination" className="hidden w-full px-6 py-8 md:block lg:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] justify-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className={cn(
              'border-outline/30 flex size-8 items-center justify-center rounded-xs border',
              currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <PreviousIcon aria-hidden="true" />
          </button>

          {paginationItems.map((item) => {
            if (typeof item !== 'number') {
              return (
                <span
                  key={item}
                  aria-hidden="true"
                  className="text-foreground-secondary border-outline/30 flex size-8 items-center justify-center rounded-xs border text-xs leading-4 font-bold"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = item === currentPage;

            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={isCurrentPage ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'border-outline/30 flex size-8 items-center justify-center rounded-xs border text-xs leading-4 font-bold',
                  isCurrentPage
                    ? 'bg-primary text-on-primary'
                    : 'text-foreground-secondary cursor-pointer',
                )}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            className={cn(
              'border-outline/30 flex size-8 items-center justify-center rounded-xs border',
              currentPage === totalPages ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <NextIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
