'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import CloseIcon from '@/assets/icons/navigation/close.svg';
import LogoutIcon from '@/assets/icons/navigation/logout.svg';
import TasklyMark from '@/assets/icons/taskly-mark.svg';
import { mainNavigation } from '@/config/navigation';
import { cn } from '@/lib/cn';

import { ActiveProjectNavigation } from './active-project-navigation';
import { useEffect, useRef } from 'react';

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
};

export function MobileDrawer({ isOpen, onClose, onLogout, isLoggingOut }: MobileDrawerProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const dialog = dialogRef.current;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) {
        dialogRef.current?.focus();
      }
    }

    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) onCloseRef.current();
    };
    desktop.addEventListener('change', closeOnDesktop);
    closeOnDesktop();
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      desktop.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  return (
    <div
      className={cn('fixed inset-0 z-50 lg:hidden', !isOpen && 'pointer-events-none')}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={-1}
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-[rgba(4,27,60,0.4)] backdrop-blur-[2px]',
          'transition-opacity duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal={isOpen || undefined}
        tabIndex={-1}
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
            ref={closeButtonRef}
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
            onClick={() => void onLogout()}
            disabled={isLoggingOut}
            className={cn(
              'text-error flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-sm font-medium',
              isLoggingOut && 'cursor-not-allowed opacity-60',
            )}
          >
            <LogoutIcon
              aria-hidden="true"
              className={cn('size-[18px] shrink-0', isLoggingOut && 'animate-pulse')}
            />

            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
