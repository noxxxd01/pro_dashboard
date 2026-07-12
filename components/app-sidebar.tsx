'use client';

import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  TerminalSquareIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
  FrameIcon,
  PieChartIcon,
  MapIcon,
  Box,
  ScanBarcode,
  Logs,
} from 'lucide-react';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Acme Inc',
      logo: <GalleryVerticalEndIcon />,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: <AudioLinesIcon />,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: <TerminalIcon />,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Bureaus',
      url: '#',
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        {
          title: 'Cybersecurity',
          url: '/cybersecurity',
        },
        {
          title: 'ILCDB',
          url: '/ilcdb',
        },
        {
          title: 'FW4A',
          url: '#',
        },
      ],
    },
    {
      title: 'Inventory',
      url: '#',
      icon: <Box />,
      items: [
        {
          title: 'Supply Monitoring',
          url: '/supply-monitoring',
        },
        {
          title: 'Equipment Monitoring',
          url: '#',
        },
      ],
    },
    {
      title: 'Documents',
      url: '#',
      icon: <BookOpenIcon />,
      items: [
        {
          title: 'Letter Monitoring',
          url: '/letter-monitoring',
        },
        {
          title: 'Bills Monitoring',
          url: '/bills-monitoring',
        },
      ],
    },
    {
      title: 'Procurement',
      url: '#',
      icon: <ScanBarcode />,
      items: [
        {
          title: 'General',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'OJT Monitoring',
      url: '/ojt-monitoring',
      icon: <FrameIcon />,
    },
    {
      name: 'Virtual Attendance Log',
      url: '#',
      icon: <PieChartIcon />,
    },
    {
      name: 'Logs',
      url: '#',
      icon: <Logs />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
