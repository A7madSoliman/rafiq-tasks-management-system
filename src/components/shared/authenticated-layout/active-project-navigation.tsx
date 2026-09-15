'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ChevronIcon from '@/assets/icons/navigation/chevron.svg';
import ProjectFolderIcon from '@/assets/icons/navigation/project-folder.svg';
import { activeProjectNavigation } from '@/config/navigation';
import { cn } from '@/lib/cn';

type ActiveProjectNavigationProps = {
  isCollapsed: boolean;
  onNavigate?: () => void;
};

const ACTIVE_PROJECT_NAME = 'Active Project Name';

export function ActiveProjectNavigation({ isCollapsed, onNavigate }: ActiveProjectNavigationProps) {
  const pathname = usePathname();

  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const popupContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPopupOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !popupContainerRef.current?.contains(target)) {
        setIsPopupOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPopupOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupOpen]);

  if (isCollapsed) {
    return (
      <div ref={popupContainerRef} className="relative mt-3 border-t border-black/10 pt-4">
        <button
          type="button"
          aria-label="Open active project navigation"
          aria-expanded={isPopupOpen}
          aria-controls="active-project-popup"
          onClick={() => {
            setIsPopupOpen(false);
            onNavigate?.();
          }}
          className={cn(
            'mx-auto flex size-10 cursor-pointer items-center justify-center rounded-sm transition-colors duration-200',
            isPopupOpen && 'bg-surface',
          )}
        >
          <ProjectFolderIcon
            aria-hidden="true"
            className={cn('size-5', isPopupOpen && 'text-primary [&_path]:stroke-current')}
          />
        </button>

        <nav
          id="active-project-popup"
          aria-label="Active project navigation"
          className={cn(
            'bg-surface-highest absolute top-4 left-[calc(100%+8px)] z-50 w-[246px] origin-left rounded-r-md p-2',
            'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
            isPopupOpen
              ? 'translate-x-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-x-1 scale-[0.98] opacity-0',
          )}
        >
          {activeProjectNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'text-foreground flex h-10 items-center gap-3 px-3 text-sm font-medium',
                  isActive && 'bg-surface-low rounded-full',
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-black/10 pt-4">
      <button
        type="button"
        aria-expanded={isAccordionOpen}
        aria-controls="active-project-links"
        onClick={() => setIsAccordionOpen((current) => !current)}
        className={cn(
          'bg-surface-highest flex w-full items-center gap-3 p-3 text-left',
          isAccordionOpen ? 'rounded-t-[6px]' : 'rounded-[6px]',
        )}
      >
        <ProjectFolderIcon aria-hidden="true" className="size-5 shrink-0" />

        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold">
          {ACTIVE_PROJECT_NAME}
        </span>

        <ChevronIcon
          aria-hidden="true"
          className={cn(
            'size-6 shrink-0 transition-transform duration-300 motion-reduce:transition-none',
            isAccordionOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        id="active-project-links"
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none',
          isAccordionOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <nav
            aria-label="Active project navigation"
            className="bg-surface flex flex-col gap-1 rounded-b-[6px] p-2"
          >
            {activeProjectNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'text-foreground flex h-10 items-center gap-3 px-4 text-sm font-medium',
                    isActive && 'bg-surface-low rounded-full',
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
