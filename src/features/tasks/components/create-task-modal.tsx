'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import CloseIcon from '@/assets/icons/navigation/close.svg';

type CreateTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isSubmitting?: boolean;
};

export function CreateTaskModal({
  isOpen,
  onClose,
  children,
  isSubmitting = false,
}: CreateTaskModalProps) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!isSubmitting) {
          event.preventDefault();
          onClose();
        }

        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const dialog = dialogRef.current;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div aria-hidden="true" className="bg-foreground/40 absolute inset-0 backdrop-blur-[2px]" />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add New Task"
        tabIndex={-1}
        className="bg-surface-low md:bg-surface relative z-10 flex h-[857px] max-h-[calc(100dvh-16px)] w-full flex-col overflow-hidden rounded-t-[32px] shadow-[0_-4px_12px_rgba(4,27,60,0.06)] md:h-[870px] md:max-h-[calc(100dvh-48px)] md:max-w-[896px] md:rounded-md md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        {/* Mobile header */}
        <div className="flex shrink-0 flex-col gap-[10px] px-6 pt-8 md:hidden">
          <div aria-hidden="true" className="bg-outline/30 mx-auto h-[6px] w-12 rounded-full" />

          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-2xl leading-8 font-bold tracking-[-0.6px]">
              Add New Task
            </h2>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close create task"
              className="flex size-[30px] items-center justify-center rounded-[12px]"
            >
              <CloseIcon aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Form content will be added in the next step */}
        <div className="min-h-0 flex-1">{children}</div>
      </section>
    </div>
  );
}
