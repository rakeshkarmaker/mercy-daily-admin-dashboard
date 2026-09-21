import { AppSidebar } from '@/components/main/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ModeToggle } from '@/components/mode-toggle'
import { useAppSettings } from '@/hooks/use-app-settings'
import { resolveImage } from '@/api/base'

type AuthUser = {
    id: string
    name: string
    email: string
    role: string
    image: string
}

/**
 * Route guard: token presence check only — no API call per navigation.
 * Token VALIDITY is enforced by the API client (401 → silent refresh →
 * retry, or clear + hard redirect on terminal failure), which already
 * covers every page's data requests. Validating /auth/me here on every
 * navigation made each route change (and each hover preload) wait on a
 * network round-trip and broke page switching.
 */
export const Route = createFileRoute('/__main')({
    beforeLoad: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            throw redirect({ to: '/signin' })
        }

        const raw = localStorage.getItem('auth_user')
        if (!raw) {
            throw redirect({ to: '/signin' })
        }
        try {
            const user = JSON.parse(raw) as AuthUser
            if (user.role !== 'ADMIN') {
                throw redirect({ to: '/signin' })
            }
            return { user }
        } catch {
            localStorage.removeItem('auth_user')
            throw redirect({ to: '/signin' })
        }
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { user } = Route.useRouteContext()
    const { logoUrl } = useAppSettings()

    return (
        <SidebarProvider>
            <TooltipProvider>
                <AppSidebar user={user} />
                <SidebarInset>
                    <header className="sticky top-0 z-10 bg-background flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="-ml-1 text-primary" />
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                                Hello {user.name.split(' ')[0]} <span className="text-3xl">👋</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {logoUrl && (
                                <img src={resolveImage(logoUrl)} alt="App logo" className="hidden sm:block h-10 w-auto object-contain" />
                            )}
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium">{user.name}</span>
                                </div>
                                <div className="size-10 rounded-full overflow-hidden bg-muted">
                                    <img src={resolveImage(user.image)} alt={user.name} className="size-full object-cover" />
                                </div>
                            </div>
                            <ModeToggle />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 min-w-0 w-full">
                        <Outlet />
                    </div>
                </SidebarInset>
            </TooltipProvider>
        </SidebarProvider>
    )
}
