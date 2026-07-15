import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:bg-transparent active:bg-transparent'
        >
          <div className='flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden bg-white'>
            <img
              src='/logo.png'
              alt='DICT logo'
              className='size-full object-contain'
            />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden '>
            <span className='truncate font-medium'>DICT</span>
            <span className='truncate text-xs'>
              Surigao del Norte Provincial Office
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
