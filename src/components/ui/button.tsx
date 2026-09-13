import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(163.4809deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] px-lg py-sm font-semibold text-on-primary drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]',
  secondary: 'px-lg py-[0.625rem] font-semibold text-primary',
  ghost: 'px-lg py-[0.625rem] font-medium text-foreground-muted opacity-60',
};

export function Button({ className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xs text-[0.875rem] leading-[1.25rem]',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
