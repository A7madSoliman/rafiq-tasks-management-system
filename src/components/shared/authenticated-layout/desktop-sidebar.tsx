'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CollapseIcon from '@/assets/icons/navigation/collapse.svg';
import LogoutIcon from '@/assets/icons/navigation/logout.svg';
import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { mainNavigation } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { ActiveProjectNavigation } from './active-project-navigation';

type DesktopSidebarProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

export function DesktopSidebar({
  isCollapsed,
  onToggleCollapse,
  onLogout,
  isLoggingOut,
}: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'bg-surface-low hidden h-dvh shrink-0 flex-col transition-[width] duration-300 ease-in-out motion-reduce:transition-none lg:sticky lg:top-0 lg:flex',
        isCollapsed ? 'w-20 px-2 py-4' : 'w-64 p-4',
      )}
    >
      <div className={cn('flex h-7 items-center', isCollapsed ? 'justify-center' : 'gap-2 px-2')}>
        <TasklyMark aria-hidden="true" className="h-5 w-[18px] shrink-0" />

        {!isCollapsed && (
          <span className="text-foreground text-xl leading-7 font-bold tracking-[-0.5px] whitespace-nowrap">
            TASKLY
          </span>
        )}
      </div>

      <nav aria-label="Main navigation" className="mt-8 flex flex-1 flex-col gap-1">
        {mainNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              className={cn(
                'flex h-10 items-center rounded-sm text-sm leading-5 font-medium',
                isCollapsed ? 'mx-auto w-10 justify-center' : 'w-full gap-3 px-3',
                isActive
                  ? 'bg-surface text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]'
                  : 'text-foreground',
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  'h-4 w-auto shrink-0',
                  isActive && 'text-primary [&_path]:fill-current',
                )}
              />

              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}

        <ActiveProjectNavigation
          key={isCollapsed ? 'collapsed' : 'expanded'}
          isCollapsed={isCollapsed}
        />
      </nav>

      <div className="border-outline/20 flex flex-col gap-1 border-t pt-[25px]">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'text-foreground flex h-10 items-center text-sm leading-5 font-medium',
            isCollapsed ? 'mx-auto w-10 justify-center' : 'w-full gap-3 px-3',
          )}
        >
          <CollapseIcon
            aria-hidden="true"
            className={cn(
              'h-5 w-[12px] shrink-0 transition-transform duration-300 motion-reduce:transition-none',
              isCollapsed && 'rotate-180',
            )}
          />

          {!isCollapsed && <span>Collapse</span>}
        </button>

        <button
          type="button"
          onClick={() => void onLogout()}
          disabled={isLoggingOut}
          aria-label={isCollapsed ? (isLoggingOut ? 'Logging out...' : 'Logout') : undefined}
          className={cn(
            'text-error flex h-10 cursor-pointer items-center text-sm leading-5 font-medium',
            isCollapsed ? 'mx-auto w-10 justify-center' : 'w-full gap-3 px-3',
            isLoggingOut && 'cursor-not-allowed opacity-60',
          )}
        >
          <LogoutIcon
            aria-hidden="true"
            className={cn('size-[18px] shrink-0', isLoggingOut && 'animate-pulse')}
          />

          {!isCollapsed && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  );
}
