'use client';

import CloseIcon from '@/assets/icons/navigation/close.svg';
import CopyLinkIcon from '@/assets/icons/epics/details/copy-link.svg';
import EpicIcon from '@/assets/icons/epics/details/epic.svg';
import type { ProjectEpic } from '../types/project-epic';
import { EpicDetailsContent } from './epic-details-content';
import { useEffect, useRef } from 'react';

type EpicDetailsModalStatus = 'loading' | 'success' | 'error';

type EpicDetailsModalProps = {
  isOpen: boolean;
  epic: ProjectEpic | null;
  status: EpicDetailsModalStatus;
  errorMessage: string | null;
  onClose: () => void;
};

export function EpicDetailsModal({
  isOpen,
  epic,
  status,
  errorMessage,
  onClose,
}: EpicDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Epic details"
        className="bg-surface relative z-10 flex max-h-[calc(100dvh-16px)] w-full flex-col overflow-hidden rounded-t-[32px] shadow-[0_-4px_12px_rgba(4,27,60,0.06)] md:max-h-[calc(100dvh-48px)] md:max-w-[672px] md:rounded-md md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <div
          aria-hidden="true"
          className="bg-outline/30 mx-auto mt-8 h-[6px] w-12 shrink-0 rounded-full md:hidden"
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 pt-6 md:px-8 md:pt-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {status === 'success' && epic ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <EpicIcon aria-hidden="true" />

                    <p className="text-foreground/60 truncate text-xs leading-4 font-bold tracking-[0.6px] uppercase">
                      {epic.epicId}
                    </p>
                  </div>
                ) : (
                  <p className="text-foreground/60 text-xs leading-4 font-bold tracking-[0.6px] uppercase">
                    Epic Details
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-foreground-secondary flex items-center gap-1 rounded-xs p-1.5 text-xs leading-5 font-medium md:gap-2 md:px-3 md:py-1.5 md:text-sm">
                  <CopyLinkIcon aria-hidden="true" />
                  <span>Copy link</span>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close epic details"
                  className="flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-[12px]"
                >
                  <CloseIcon aria-hidden="true" />
                </button>
              </div>
            </div>

            {status === 'success' && epic && (
              <div className="border-outline/50 md:border-surface-highest mt-3 rounded-md border p-2 md:mt-4 md:rounded-[12px] md:p-3">
                <h2 className="text-foreground text-base leading-[25px] font-semibold break-words md:text-xl md:leading-8 md:font-bold">
                  {epic.title}
                </h2>
              </div>
            )}
          </div>

          {status === 'loading' && (
            <div className="px-6 py-8 md:px-8">
              <p role="status" className="text-foreground-muted text-sm">
                Loading epic details...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="px-6 py-8 md:px-8">
              <p role="alert" className="text-error text-sm">
                {errorMessage ?? 'Unable to load epic details.'}
              </p>
            </div>
          )}

          {status === 'success' && epic && <EpicDetailsContent epic={epic} />}
        </div>
      </section>
    </div>
  );
}
