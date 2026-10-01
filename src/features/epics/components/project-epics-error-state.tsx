import ErrorIcon from '@/assets/icons/epics/error-state/error.svg';

type ProjectEpicsErrorStateProps = {
  onRetry: () => void;
};

export function ProjectEpicsErrorState({ onRetry }: ProjectEpicsErrorStateProps) {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] w-full items-center justify-center px-6 py-12">
      <div role="alert" className="flex w-full max-w-[928px] flex-col items-center text-center">
        <div className="bg-error-container flex size-16 items-center justify-center rounded-[12px]">
          <ErrorIcon aria-hidden="true" />
        </div>

        <h1 className="text-foreground mt-6 text-xl leading-7 font-semibold">
          Something went wrong
        </h1>

        <p className="text-foreground-secondary mt-2 max-w-[308px] text-base leading-6">
          We&apos;re having trouble retrieving your project epics right now. Please try again in a
          moment.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-on-primary mt-6 rounded-xs px-6 py-[10px] text-base leading-6 font-semibold shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
