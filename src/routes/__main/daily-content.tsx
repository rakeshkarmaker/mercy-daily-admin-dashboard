import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/__main/daily-content')({
    beforeLoad: () => {
        throw redirect({ to: '/prayer-management' })
    },
    component: () => null,
})
