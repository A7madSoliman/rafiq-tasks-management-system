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
          'bg-surface-highest px-md text-foreground placeholder:text-placeholder w-full rounded-sm pt-[0.8125rem] pb-[0.875rem] text-[0.875rem]',
          'aria-invalid:bg-error-container aria-invalid:py-sm aria-invalid:text-on-error-container aria-invalid:leading-[1.25rem]',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
