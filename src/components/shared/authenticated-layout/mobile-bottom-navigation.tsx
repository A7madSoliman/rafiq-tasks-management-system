'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { mainNavigation, mobileNavigation } from '@/config/navigation';
import { getActiveProjectId } from '@/features/projects/utils/get-active-project-id';

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const projectId = getActiveProjectId(pathname);

  const navigationItems = projectId ? mobileNavigation : mainNavigation;

  return (
    <nav
      aria-label="Mobile navigation"
      className="bg-surface-low fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-center lg:hidden"
    >
      <div className="flex items-center justify-center gap-8">
        {navigationItems.map((item) => {
          const href =
            'href' in item
              ? item.href
              : item.segment === null
                ? '/project'
                : `/project/${projectId}/${item.segment}`;

          const isActive = pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-w-[72px] flex-col items-center justify-center gap-0.5 text-[10px] leading-[15px]',
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
      </div>
    </nav>
  );
}
