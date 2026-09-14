import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <header className="px-lg sm:bg-background absolute top-0 z-20 flex h-16 w-full items-center bg-[rgba(249,249,255,0.8)] backdrop-blur-[6px] sm:relative sm:h-20 sm:px-10 sm:backdrop-blur-none">
        <div className="gap-xs flex items-center">
          <TasklyMark aria-hidden="true" className="w-icon-sm h-[19.45px] sm:h-5" />

          <span className="text-foreground text-xl leading-7 font-bold tracking-[-0.5px]">
            TASKLY
          </span>
        </div>
      </header>

      <main className="px-lg sm:px-lg relative z-10 pt-20 pb-12 sm:flex sm:justify-center sm:py-[147px]">
        <LoginForm />
      </main>

      <div aria-hidden="true" className="p-2xl absolute right-0 bottom-0 z-0 opacity-40">
        <div className="relative size-64">
          <div className="absolute inset-0 rounded-xl bg-[rgba(0,82,204,0.2)] blur-[50px]" />

          <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[rgba(0,61,155,0.1)]" />
        </div>
      </div>
    </div>
  );
}
