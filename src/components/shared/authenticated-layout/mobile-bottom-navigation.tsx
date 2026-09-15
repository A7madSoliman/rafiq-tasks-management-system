'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { mobileNavigation } from '@/config/navigation';

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="bg-surface-low fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 lg:hidden"
    >
      {mobileNavigation.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] leading-[15px]',
              isActive ? 'text-primary font-semibold' : 'text-foreground-muted font-normal',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn('h-5 w-5 shrink-0', isActive && 'text-primary [&_path]:fill-current')}
            />

            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
