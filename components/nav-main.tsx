'use client';

import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronRightIcon } from 'lucide-react';

interface NavSubItem {
  title: string;
  url: string;
  items?: {
    title: string;
    url: string;
  }[];
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?: NavSubItem[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items || item.items.length === 0) {
            const isActive =
              item.url !== '#' &&
              (pathname === item.url || pathname.startsWith(`${item.url}/`));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <a href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const isActiveGroup = item.items?.some(
            (subItem) =>
              subItem.url !== '#' &&
              (pathname === subItem.url ||
                pathname.startsWith(`${subItem.url}/`)),
          );

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isActiveGroup}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      if (!subItem.items || subItem.items.length === 0) {
                        const isSubActive =
                          subItem.url !== '#' &&
                          (pathname === subItem.url ||
                            pathname.startsWith(`${subItem.url}/`));

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={isSubActive}>
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      }

                      const isActiveNestedGroup = subItem.items.some(
                        (nestedItem) =>
                          nestedItem.url !== '#' &&
                          (pathname === nestedItem.url ||
                            pathname.startsWith(`${nestedItem.url}/`)),
                      );
                      const isSubActive =
                        subItem.url !== '#' &&
                        (pathname === subItem.url ||
                          pathname.startsWith(`${subItem.url}/`));

                      return (
                        <Collapsible
                          key={subItem.title}
                          defaultOpen={isSubActive || isActiveNestedGroup}
                          className='group/nested-collapsible'
                        >
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className='cursor-pointer'>
                                <span>{subItem.title}</span>
                                <ChevronRightIcon className='ml-auto size-3.5 shrink-0 text-white transition-transform duration-200 group-data-[state=open]/nested-collapsible:rotate-90' />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {subItem.items.map((nestedItem) => {
                                  const isNestedActive =
                                    nestedItem.url !== '#' &&
                                    (pathname === nestedItem.url ||
                                      pathname.startsWith(`${nestedItem.url}/`));

                                  return (
                                    <SidebarMenuSubItem key={nestedItem.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={isNestedActive}
                                      >
                                        <a href={nestedItem.url}>
                                          <span>{nestedItem.title}</span>
                                        </a>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
