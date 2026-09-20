import NextIcon from '@/assets/icons/projects/pagination-next.svg';
import PreviousIcon from '@/assets/icons/projects/pagination-previous.svg';
import { cn } from '@/lib/cn';

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
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav aria-label="Projects pagination" className="hidden w-full justify-end p-8 lg:flex">
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
          aria-label="Previous page"
          className={cn(
            'border-outline/30 flex size-8 cursor-pointer items-center justify-center rounded-xs border',
            currentPage === 1 && 'cursor-not-allowed opacity-40',
          )}
        >
          <PreviousIcon aria-hidden="true" className="h-[7px] w-[5px]" />
        </button>

        {pageNumbers.map((page) => {
          const isCurrentPage = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isCurrentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
              className={cn(
                'text-foreground-secondary border-outline/30 flex size-8 cursor-pointer items-center justify-center rounded-xs border text-xs font-bold',
                isCurrentPage && 'bg-primary text-on-primary',
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className={cn(
            'border-outline/30 flex size-8 cursor-pointer items-center justify-center rounded-xs border',
            currentPage === totalPages && 'cursor-not-allowed opacity-40',
          )}
        >
          <NextIcon aria-hidden="true" className="h-[7px] w-[5px]" />
        </button>
      </div>
    </nav>
  );
}
