import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function NavMain({ items }: { items: { title: string; url: string; icon?: ReactNode }[] }) {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    const { setOpenMobile } = useSidebar()

    return (
        <SidebarGroup className="px-4 group-data-[collapsible=icon]:px-0">
            <SidebarMenu className="gap-3">
                {items.map((item) => {
                    const isActive = item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                isActive={isActive}
                                tooltip={item.title}
                                asChild
                                onClick={() => setOpenMobile(false)}
                                className={`h-11 rounded-full px-5 group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto shadow-sm transition-all duration-200 border border-transparent ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md'
                                        : 'bg-card text-foreground hover:bg-card hover:text-primary hover:border-border hover:shadow-md'
                                }`}
                            >
                                <Link to={item.url} className="flex items-center gap-3">
                                    <div className={`rounded-full p-1.5 ${isActive ? 'bg-primary-foreground/20' : 'bg-transparent'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="font-medium text-base group-data-[collapsible=icon]:hidden">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
