import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { PendingComp } from '@/components/shared/pending-comp'
import { ErrorComp } from '@/components/shared/error-comp'
import { NotFoundComp } from '@/components/shared/not-found-comp'

import { ThemeProvider } from '@/components/theme-provider'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

const router = createRouter({
    routeTree,
    context: { queryClient },
    // Route changes should be driven by the clicked Link, not by hover
    // preloads that can race the active navigation.
    defaultPreload: false,
    scrollRestoration: true,
    defaultPendingComponent: PendingComp,
    defaultErrorComponent: ErrorComp,
    defaultNotFoundComponent: NotFoundComp,
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ThemeProvider>,
    )
}
