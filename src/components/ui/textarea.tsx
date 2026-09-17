import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={ariaInvalid}
        className={cn(
          'bg-surface-highest text-foreground placeholder:text-placeholder px-md py-md w-full resize-none border border-transparent',
          'focus-visible:outline-none',
          'aria-invalid:border-error aria-invalid:bg-error-container aria-invalid:text-on-error-container',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
