import type { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { getUserInitials } from '@/features/auth/utils/get-user-initials';

type NavbarProps = {
  user: AuthenticatedUser | null;
};

export function Navbar({ user }: NavbarProps) {
  const initials = getUserInitials(user?.name ?? null);

  return (
    <header className="bg-background sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <div aria-hidden="true" className="flex size-8 items-center justify-center">
          <span className="text-lg leading-none">☰</span>
        </div>

        <p className="text-foreground text-xl leading-7 font-bold tracking-[-0.5px]">TASKLY</p>
      </div>

      <div className="ml-auto flex min-w-0 items-center">
        <div className="border-outline/30 flex items-center gap-3 border-l pl-[17px]">
          <div className="hidden min-w-0 flex-col items-end lg:flex">
            <p className="text-foreground max-w-[180px] truncate text-sm leading-5 font-semibold">
              {user?.name ?? '—'}
            </p>

            <p className="text-primary max-w-[180px] truncate text-[10px] leading-5 font-bold tracking-[1px] uppercase">
              {user?.jobTitle ?? '—'}
            </p>
          </div>

          <div
            aria-label={user?.name ?? 'Authenticated user'}
            className="bg-primary-container flex size-10 shrink-0 items-center justify-center rounded-md text-base leading-6 font-bold text-white"
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
