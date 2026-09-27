import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__auth')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <main className="min-h-screen w-full flex bg-background text-foreground">
            <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
                <img src="/auth-bg.png" alt="Auth background" className="absolute inset-0 w-full h-full object-cover opacity-90" />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-105 flex flex-col items-center">
                    <img src="/mercy-logo.png" alt="Mercy Logo" className="h-16 w-auto mb-8 object-contain" />
                    <Outlet />
                </div>
            </div>
        </main>
    )
}
