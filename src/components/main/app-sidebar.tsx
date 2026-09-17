'use client'

import { NavMain } from '@/components/main/nav-main'
import { NavUser } from '@/components/main/nav-user'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { ClipboardList, CreditCard, Flag, HandHeart, LayoutDashboard, Settings, Users, UsersRound, Bell, WalletCards } from 'lucide-react'

const NAV_ITEMS = [
    { title: 'Dashboard', url: '/', icon: <LayoutDashboard className="size-4" /> },
    { title: 'User Management', url: '/user-management', icon: <UsersRound className="size-4" /> },
    { title: 'Daily Content', url: '/daily-content', icon: <ClipboardList className="size-4" /> },
    { title: 'Prayer Management', url: '/prayer-management', icon: <HandHeart className="size-4" /> },
    { title: 'Community', url: '/community', icon: <Users className="size-4" /> },
    { title: 'Payments', url: '/payments', icon: <WalletCards className="size-4" /> },
    { title: 'Subscriptions', url: '/subscriptions', icon: <CreditCard className="size-4" /> },
    { title: 'Notifications', url: '/notifications', icon: <Bell className="size-4" /> },
    { title: 'Reports', url: '/reports', icon: <Flag className="size-4" /> },
    { title: 'Settings', url: '/settings', icon: <Settings className="size-4" /> },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: any }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex items-center justify-center px-4 py-3 group-data-[collapsible=icon]:px-0">
                <div className="flex h-11 items-center px-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto">
                    <img src="/favicon.svg" alt="Icon" className="size-8 shrink-0 object-contain hidden group-data-[collapsible=icon]:block" />
                    <img src="/mercy-logo.svg" alt="Logo" className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden" />
                </div>
            </SidebarHeader>
            <SidebarContent><NavMain items={NAV_ITEMS} /></SidebarContent>
            <SidebarFooter><NavUser user={user} /></SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
