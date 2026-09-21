import { useSearchParams } from '@/hooks/use-search-params'
import { createFileRoute } from '@tanstack/react-router'
import type { FilterState } from '@/components/shared/filter-builder'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as z from 'zod'
import {
    adminCreateUser,
    adminDeleteUser,
    adminSetUserStatus,
    adminToggleUserStatus,
    adminUpdateUser,
    listUsers,
    toApiRole,
    toUiUser,
} from '@/api/users'
import type { User } from '@/api/users'
import type { userSchema } from '@/components/features/user-management/user-management-ui'
import { UserManagementUI } from '@/components/features/user-management/user-management-ui'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    q: z.string().catch('').optional(),
    filters: z.string().catch('[]').optional(),
})

export const Route = createFileRoute('/__main/user-management')({
    validateSearch: searchSchema,
    component: RouteComponent,
})

function RouteComponent() {
    const queryClient = useQueryClient()
    const search = Route.useSearch()
    const mergeSearch = useSearchParams()

    const page = search.page ?? 1
    const limit = search.limit ?? 10
    const searchQuery = search.q ?? ''
    const filters: FilterState[] = (() => {
        try {
            return JSON.parse(search.filters ?? '[]')
        } catch {
            return []
        }
    })()

    const setQuery = (q: string) => mergeSearch({ q, page: 1 })
    const setFilters = (newFilters: FilterState[]) => mergeSearch({ filters: JSON.stringify(newFilters), page: 1 })
    const resetSearch = () => mergeSearch({ q: '', filters: '[]', page: 1 })

    // Server-backed list. The backend owns search (`search` ILIKE name/email)
    // and pagination; client-side filters stay for the date/status builder.
    const { data: list = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['users', page, limit, searchQuery],
        queryFn: () => listUsers({ page, limit, search: searchQuery || undefined }),
    })

    const users: User[] = list.data.map(toUiUser)

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

    const handleSaveUser = async (id: string | null, values: z.infer<typeof userSchema>) => {
        try {
            if (id) {
                await adminUpdateUser(id, {
                    name: values.name,
                    email: values.email,
                    role: toApiRole(values.role),
                    avatarUrl: values.image || null,
                })
                toast.success('User updated')
            } else {
                const created = await adminCreateUser({
                    name: values.name,
                    email: values.email,
                    role: toApiRole(values.role),
                    avatarUrl: values.image || undefined,
                })
                toast.success(`User created — temporary password: ${created.temporaryPassword}`, {
                    duration: 15000,
                })
            }
            invalidate()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        }
    }

    const handleToggleStatus = async (id: string) => {
        const target = users.find((u) => u.id === id)
        if (!target) return
        try {
            await adminToggleUserStatus(id, target.status !== 'Active')
            toast.success(target.status === 'Active' ? 'User deactivated' : 'User activated')
            invalidate()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        }
    }

    const handleBanUser = async (id: string, banned: boolean) => {
        try {
            await adminSetUserStatus(id, banned ? 'BANNED' : 'ACTIVE')
            toast.success(banned ? 'User banned' : 'User unbanned')
            invalidate()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        }
    }

    const handleDeleteUser = async (id: string) => {
        try {
            await adminDeleteUser(id)
            toast.success('User deactivated')
            invalidate()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong')
        }
    }

    return (
        <UserManagementUI
            users={users}
            totalUsers={list.total}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            onResetSearch={resetSearch}
            onSaveUser={handleSaveUser}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
            onBanUser={handleBanUser}
        />
    )
}
