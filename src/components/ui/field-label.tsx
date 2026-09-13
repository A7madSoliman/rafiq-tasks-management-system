import type { LabelHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  invalid?: boolean;
};

export function FieldLabel({ className, invalid = false, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn(
        'text-[0.625rem] leading-[0.9375rem] font-bold tracking-[0.0625rem] uppercase',
        invalid ? 'text-error' : 'text-foreground-subtle',
        className,
      )}
      {...props}
    />
  );
}
