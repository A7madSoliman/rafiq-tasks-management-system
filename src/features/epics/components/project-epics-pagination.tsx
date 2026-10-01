import NextIcon from '@/assets/icons/epics/pagination/next.svg';
import PreviousIcon from '@/assets/icons/epics/pagination/previous.svg';

const paginationItems = ['1', '2', '3', '...', '15'] as const;

export function ProjectEpicsPagination() {
  return (
    <nav aria-label="Epics pagination" className="hidden justify-end pt-12 pb-8 lg:flex">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled
          className="border-outline/30 flex size-8 items-center justify-center rounded-xs border"
        >
          <PreviousIcon aria-hidden="true" />
        </button>

        {paginationItems.map((item) => {
          const isActive = item === '1';

          return (
            <button
              key={item}
              type="button"
              disabled
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'bg-primary text-on-primary border-outline/30 flex size-8 items-center justify-center rounded-xs border text-xs leading-4 font-bold'
                  : 'text-foreground-secondary border-outline/30 flex size-8 items-center justify-center rounded-xs border text-xs leading-4 font-bold'
              }
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          disabled
          className="border-outline/30 flex size-8 items-center justify-center rounded-xs border"
        >
          <NextIcon aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
