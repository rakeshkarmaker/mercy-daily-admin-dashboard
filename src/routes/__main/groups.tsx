import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { GroupsUI } from '@/components/features/groups/groups-ui'
import { deleteGroup, listGroups, setGroupStatus } from '@/api/groups'
import type { AdminGroupSummary, GroupStatus } from '@/api/groups'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    // Narrowed by statusFromParam so a hand-edited URL can never break the query.
    status: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/groups')({
    validateSearch: searchSchema,
    component: GroupsPage,
})

function statusFromParam(value: string | undefined): GroupStatus | undefined {
    return value === 'ACTIVE' || value === 'SUSPENDED' || value === 'DELETED' ? value : undefined
}

function GroupsPage() {
    const { page = 1, limit = 10, search: searchQuery = '', status: statusParam = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const status = statusFromParam(statusParam)
    const search = searchQuery.trim() || undefined

    const { data: list = { data: [], page, limit, total: 0 }, isLoading } = useQuery({
        queryKey: ['groups', page, limit, status ?? 'all', search ?? ''],
        queryFn: () => listGroups({ page, limit, status, search }),
    })

    // Every mutation refreshes both the table and the open detail page.
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        queryClient.invalidateQueries({ queryKey: ['group'] })
    }

    const suspendMutation = useMutation({
        mutationFn: (group: AdminGroupSummary) => setGroupStatus(group.id, 'SUSPENDED', 'Suspended from the admin dashboard'),
        onSuccess: (_, group) => {
            toast.success(`${group.name} suspended`)
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const reactivateMutation = useMutation({
        mutationFn: (group: AdminGroupSummary) => setGroupStatus(group.id, 'ACTIVE'),
        onSuccess: (_, group) => {
            toast.success(`${group.name} reactivated`)
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (group: AdminGroupSummary) => deleteGroup(group.id),
        onSuccess: (_, group) => {
            toast.success(`${group.name} deleted`)
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleStatusChange = (value: 'ALL' | GroupStatus) => {
        mergeSearch({ status: value === 'ALL' ? undefined : value, page: 1 })
    }

    const handleReset = () => {
        mergeSearch({ search: undefined, status: undefined, page: 1 })
    }

    return (
        <GroupsUI
            groups={list.data}
            total={list.total}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            status={status ?? 'ALL'}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onReset={handleReset}
            onSuspend={(group) => suspendMutation.mutateAsync(group).then(() => undefined).catch(() => undefined)}
            onReactivate={(group) => reactivateMutation.mutateAsync(group).then(() => undefined).catch(() => undefined)}
            onDelete={(group) => deleteMutation.mutateAsync(group).then(() => undefined).catch(() => undefined)}
        />
    )
}
