import TasklyMark from '@/assets/icons/taskly-mark.svg';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background relative flex h-dvh [scrollbar-width:none] flex-col overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden">
      <header className="bg-background/80 sm:bg-background relative z-20 h-16 w-full shrink-0 backdrop-blur-[6px] sm:h-20 sm:backdrop-blur-none">
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center px-6 sm:px-10">
          <div className="flex items-center gap-2">
            <TasklyMark aria-hidden="true" className="h-[19.45px] w-[18px] sm:h-5" />

            <span className="text-foreground text-xl leading-7 font-bold tracking-[-0.5px]">
              TASKLY
            </span>
          </div>
        </div>
      </header>

      {children}

      <div
        aria-hidden="true"
        className="absolute right-0 bottom-0 z-0 hidden p-12 opacity-40 sm:block"
      >
        <div className="relative size-64">
          <div className="absolute inset-0 rounded-xl bg-[rgba(0,82,204,0.2)] blur-[50px]" />

          <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[rgba(0,61,155,0.1)]" />
        </div>
      </div>
    </div>
  );
}
