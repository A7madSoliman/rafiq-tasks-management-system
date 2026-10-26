import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const redirect = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/features/statistics/components/my-statistics-screen', () => ({
  MyStatisticsScreen: () => null,
}));
vi.mock('@/assets/icons/navigation/projects.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/navigation/statistics.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/navigation/details.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/navigation/epics.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/navigation/members.svg', () => ({ default: () => null }));
vi.mock('@/assets/icons/navigation/tasks.svg', () => ({ default: () => null }));

import MyStatisticsPage from '@/app/(protected)/my-statistics/page';
import StatisticsPage from '@/app/(protected)/statistics/page';
import { MyStatisticsScreen } from '@/features/statistics/components/my-statistics-screen';
import { mainNavigation, mobileNavigation } from '@/config/navigation';
import { proxy, config } from '@/proxy';

describe('statistics routing', () => {
  it('uses the shared sidebar/drawer entry and redirects the old placeholder', () => {
    expect(mainNavigation.find((item) => item.label === 'My Statistics')?.href).toBe(
      '/my-statistics',
    );
    expect(MyStatisticsPage().type).toBe(MyStatisticsScreen);
    StatisticsPage();
    expect(redirect).toHaveBeenCalledWith('/my-statistics');
    expect(
      mobileNavigation.filter((item) => item.segment === null).map((item) => item.label),
    ).toEqual(['Projects']);
  });

  it('includes both paths in the early auth boundary', () => {
    expect(config.matcher).toContain('/my-statistics/:path*');
    expect(config.matcher).toContain('/statistics/:path*');
    const response = proxy(new NextRequest('http://localhost/my-statistics'));
    expect(response.headers.get('location')).toBe('http://localhost/login');
  });

  it('allows the protected layout to restore a refreshable session', () => {
    const response = proxy(
      new NextRequest('http://localhost/my-statistics', {
        headers: { Cookie: 'refresh_token=test-refresh' },
      }),
    );
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
