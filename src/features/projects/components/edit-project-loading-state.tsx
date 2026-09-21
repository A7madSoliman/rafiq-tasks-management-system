export function EditProjectLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse px-6 pt-8 pb-12 lg:px-8">
      <header className="hidden lg:block">
        <div className="bg-surface-icon h-4 w-64 rounded-xs" />

        <div className="bg-surface-icon mt-4 h-10 w-56 rounded-sm" />
      </header>

      <div className="lg:mt-10 lg:flex lg:justify-center">
        <section className="lg:bg-surface mx-auto w-full max-w-[512px] lg:max-w-[672px] lg:overflow-hidden lg:rounded-md">
          <header className="lg:border-surface-low pb-8 lg:border-b lg:px-8 lg:pt-8 lg:pb-[41px]">
            <div className="flex items-center gap-4">
              <div className="bg-surface-icon hidden h-11 w-[46px] rounded-sm lg:block" />

              <div className="flex flex-1 flex-col gap-2">
                <div className="bg-surface-icon h-8 w-40 rounded-sm" />

                <div className="bg-surface-icon h-5 w-72 max-w-full rounded-xs" />
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-8 lg:px-8 lg:pt-8 lg:pb-12">
            <div className="flex flex-col gap-2">
              <div className="bg-surface-icon h-4 w-28 rounded-xs" />

              <div className="bg-surface-icon h-14 w-full rounded-md lg:h-[52px] lg:rounded-sm" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="bg-surface-icon h-4 w-24 rounded-xs" />

                <div className="bg-surface-icon hidden h-4 w-12 rounded-xs lg:block" />
              </div>

              <div className="bg-surface-icon h-32 w-full rounded-md lg:h-[148px] lg:rounded-sm" />

              <div className="bg-surface-icon ml-auto h-4 w-24 rounded-xs" />
            </div>

            <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:justify-between">
              <div className="bg-surface-icon h-12 w-full rounded-md lg:w-24 lg:rounded-sm" />

              <div className="bg-surface-icon h-14 w-full rounded-md lg:h-11 lg:w-40 lg:rounded-sm" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
