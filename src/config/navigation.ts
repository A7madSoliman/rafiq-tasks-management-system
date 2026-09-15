import ProjectsIcon from '@/assets/icons/navigation/projects.svg';
import StatisticsIcon from '@/assets/icons/navigation/statistics.svg';
import DetailsIcon from '@/assets/icons/navigation/details.svg';
import EpicsIcon from '@/assets/icons/navigation/epics.svg';
import MembersIcon from '@/assets/icons/navigation/members.svg';
import TasksIcon from '@/assets/icons/navigation/tasks.svg';

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
    icon: EpicsIcon,
  },
  {
    label: 'Tasks',
    href: '/project/tasks',
    icon: TasksIcon,
  },
  {
    label: 'Members',
    href: '/project/members',
    icon: MembersIcon,
  },
  {
    label: 'Details',
    href: '/project/details',
    icon: DetailsIcon,
  },
] as const;
