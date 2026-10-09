import MobileSearchIcon from '@/assets/icons/tasks/mobile-search.svg';
import MobileAddTaskIcon from '@/assets/icons/tasks/mobile-add-task.svg';
import NoTasksIcon from '@/assets/icons/tasks/no-tasks.svg';
import { Button } from '@/components/ui/button';

export function TaskBoardMobileEmptyState() {
  return (
    <section
      aria-label="Tasks board empty state"
      className="flex min-h-[calc(100dvh-128px)] min-w-0 flex-col px-4 pt-[38px] pb-[65px] lg:hidden"
    >
      <h1 className="text-foreground text-[30px] leading-9 font-semibold tracking-[-0.75px]">
        Active Workboard
      </h1>

      <div className="mt-6 flex flex-col gap-4">
        <label className="bg-surface-highest flex h-[47px] w-full items-center gap-[10px] rounded-md px-3">
          <MobileSearchIcon aria-hidden="true" />

          <input
            type="search"
            readOnly
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="text-foreground placeholder:text-foreground-secondary/50 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>

        <Button
          type="button"
          className="h-8 w-full gap-2 rounded-sm px-4 py-0 text-xs font-bold tracking-[1.2px] uppercase"
        >
          <MobileAddTaskIcon aria-hidden="true" />
          <span>Add New Task</span>
        </Button>
      </div>

      <div className="bg-surface-low/30 border-outline/30 mt-7 flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed text-center">
        <NoTasksIcon aria-hidden="true" />

        <p className="text-task-status-todo text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase">
          No Tasks
        </p>
      </div>
    </section>
  );
}
