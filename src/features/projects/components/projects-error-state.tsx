import ErrorStateIcon from '@/assets/icons/projects/error-state.svg';
import { Button } from '@/components/ui/button';

type ProjectsErrorStateProps = {
  onRetry: () => void;
};

export function ProjectsErrorState({ onRetry }: ProjectsErrorStateProps) {
  return (
    <section className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-6 py-12 lg:min-h-[calc(100dvh-4rem)]">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="bg-error-container flex size-16 items-center justify-center rounded-[12px]">
          <ErrorStateIcon aria-hidden="true" className="h-[25px] w-[28px]" />
        </div>

        <h2 className="text-foreground mt-6 text-xl leading-7 font-semibold">
          Something went wrong
        </h2>

        <p className="text-foreground-secondary mt-2 max-w-[308px] text-base leading-6">
          We&apos;re having trouble retrieving your projects right now. Please try again in a
          moment.
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-6 px-6 py-[10px] text-base leading-6 font-semibold"
        >
          Retry Connection
        </Button>
      </div>
    </section>
  );
}
