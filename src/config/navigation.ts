import ProjectsIcon from '@/assets/icons/navigation/projects.svg';
import StatisticsIcon from '@/assets/icons/navigation/statistics.svg';

export const mainNavigation = [
  {
    label: 'Projects',
    href: '/project',
    icon: ProjectsIcon,
  },
  {
    label: 'My Statistics',
    href: '/statistics',
    icon: StatisticsIcon,
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
