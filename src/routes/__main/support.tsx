import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { SupportUI } from '@/components/features/support/support-ui'
import {
    deleteContactMessage,
    getContactStats,
    listContactMessages,
    updateContactStatus,
} from '@/api/contact'
import type { ContactMessage, ContactMessageStatus } from '@/api/contact'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    // Narrowed by statusFromParam so a hand-edited URL never breaks the query.
    status: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/support')({
    validateSearch: searchSchema,
    component: SupportPage,
})

function statusFromParam(value: string | undefined): ContactMessageStatus | undefined {
    return value === 'NEW' || value === 'READ' || value === 'RESOLVED' ? value : undefined
}

function SupportPage() {
    const { page = 1, limit = 10, search: searchQuery = '', status: statusParam = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const status = statusFromParam(statusParam)
    const search = searchQuery.trim() || undefined

    // Real inbox: messages submitted from the website help & support form
    // (public POST /contact), newest first, server-paginated.
    const { data: list = { data: [], meta: { page, limit, total: 0, totalPages: 1 } }, isLoading } = useQuery({
        queryKey: ['support', page, limit, status ?? 'ALL', search ?? ''],
        queryFn: () => listContactMessages({ page, limit, status, search }),
    })

    const { data: stats = { unread: 0, total: 0 } } = useQuery({
        queryKey: ['support', 'stats'],
        queryFn: getContactStats,
    })

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ContactMessageStatus }) => updateContactStatus(id, status),
        onSuccess: (_, variables) => {
            toast.success(variables.status === 'RESOLVED' ? 'Message resolved' : 'Message marked as read')
            queryClient.invalidateQueries({ queryKey: ['support'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (message: ContactMessage) => deleteContactMessage(message.id),
        onSuccess: () => {
            toast.success('Message deleted')
            queryClient.invalidateQueries({ queryKey: ['support'] })
            // Deleting the last row on a later page would leave it empty.
            if (list.data.length === 1 && page > 1) mergeSearch({ page: page - 1 })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleStatusFilterChange = (next: ContactMessageStatus | 'ALL') => {
        mergeSearch({ status: next === 'ALL' ? undefined : next, page: 1 })
    }

    const handleReset = () => {
        mergeSearch({ search: undefined, status: undefined, page: 1 })
    }

    return (
        <SupportUI
            messages={list.data}
            total={list.meta.total}
            unread={stats.unread}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={status ?? 'ALL'}
            onStatusFilterChange={handleStatusFilterChange}
            onStatusChange={(id, next) => statusMutation.mutate({ id, status: next })}
            statusPending={statusMutation.isPending}
            onDelete={(message) => deleteMutation.mutateAsync(message).then(() => undefined).catch(() => undefined)}
            deletePending={deleteMutation.isPending}
            onReset={handleReset}
        />
    )
}
