import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { SignupForm } from '@/features/auth/components/signup-from';

export default function SignupPage() {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <header className="px-lg relative z-10 flex h-20 items-center sm:px-[2.5rem]">
        <div className="gap-xs flex items-center">
          <TasklyMark aria-hidden="true" className="h-5 w-[1.125rem]" />

          <span className="text-foreground text-[1.25rem] leading-[1.75rem] font-bold tracking-[-0.03125rem]">
            TASKLY
          </span>
        </div>
      </header>

      <main className="px-lg pt-xl sm:pt-md sm:pb-2xl relative z-10 pb-[4.625rem] sm:flex sm:justify-center sm:px-0">
        <SignupForm />
      </main>

      <div
        aria-hidden="true"
        className="p-2xl absolute right-0 bottom-0 hidden opacity-40 sm:block"
      >
        <div className="relative size-64">
          <div className="absolute inset-0 rounded-[0.75rem] bg-[rgba(0,82,204,0.2)] blur-[50px]" />

          <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-[0.75rem] border border-[rgba(0,61,155,0.1)]" />
        </div>
      </div>
    </div>
  );
}
