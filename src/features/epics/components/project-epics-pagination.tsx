import NextIcon from '@/assets/icons/epics/pagination/next.svg';
import PreviousIcon from '@/assets/icons/epics/pagination/previous.svg';
import { cn } from '@/lib/cn';

import { getEpicsPaginationItems } from '../utils/get-epics-pagination-items';

type ProjectEpicsPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function ProjectEpicsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ProjectEpicsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const paginationItems = getEpicsPaginationItems(currentPage, totalPages);

  return (
    <nav aria-label="Epics pagination" className="hidden justify-end pt-12 pb-8 lg:flex">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
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
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(
            'border-outline/30 flex size-8 items-center justify-center rounded-xs border',
            currentPage === totalPages ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <NextIcon aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
