export const mainNavigation = [
  {
    label: 'Projects',
    href: '/project',
  },
  {
    label: 'My Statistics',
    href: '/statistics',
  },
] as const;

export const activeProjectNavigation = [
  {
    label: 'Epics',
    href: '/project/epics',
  },
  {
    label: 'Tasks',
    href: '/project/tasks',
  },
  {
    label: 'Members',
    href: '/project/members',
  },
  {
    label: 'Details',
    href: '/project/details',
  },
] as const;
