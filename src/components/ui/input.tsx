import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={ariaInvalid}
        className={cn(
          'bg-surface-highest px-md text-foreground placeholder:text-placeholder w-full border border-transparent',
          'focus-visible:outline-none',
          'aria-invalid:border-error aria-invalid:bg-error-container aria-invalid:text-on-error-container',

          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
