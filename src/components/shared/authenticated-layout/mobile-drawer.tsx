'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import CloseIcon from '@/assets/icons/navigation/close.svg';
import LogoutIcon from '@/assets/icons/navigation/logout.svg';
import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { mainNavigation } from '@/config/navigation';
import { cn } from '@/lib/cn';

import { ActiveProjectNavigation } from './active-project-navigation';
import { useEffect } from 'react';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', !isOpen && 'pointer-events-none')}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-[rgba(4,27,60,0.4)] backdrop-blur-[2px]',
          'transition-opacity duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        aria-label="Mobile navigation"
        className={cn(
          'bg-surface-low absolute inset-y-0 left-0 flex w-full max-w-[390px] flex-col p-4 shadow-2xl',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TasklyMark aria-hidden="true" className="h-5 w-[18px]" />

            <span className="text-foreground text-xl leading-7 font-bold tracking-[-0.5px]">
              TASKLY
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex size-[30px] items-center justify-center rounded-[12px]"
          >
            <CloseIcon aria-hidden="true" className="size-[14px]" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="mt-10 flex flex-1 flex-col gap-1">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium',
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

                <span>{item.label}</span>
              </Link>
            );
          })}

          <ActiveProjectNavigation isCollapsed={false} onNavigate={onClose} />
        </nav>

        <div className="border-outline/20 border-t pt-[25px]">
          <button
            type="button"
            className="text-error flex h-10 w-full items-center gap-3 px-3 text-sm font-medium"
          >
            <LogoutIcon aria-hidden="true" className="size-[18px]" />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
