import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { SupportUI } from '@/components/features/support/support-ui'
import { getContactStats, listContactMessages, updateContactStatus } from '@/api/contact'
import type { ContactMessageStatus } from '@/api/contact'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    status: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/support')({
    validateSearch: searchSchema,
    component: SupportPage,
})

const ALLOWED_STATUSES: ContactMessageStatus[] = ['NEW', 'READ', 'RESOLVED']

function SupportPage() {
    const { page = 1, limit = 10, status = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const statusFilter: ContactMessageStatus | 'ALL' = (ALLOWED_STATUSES as string[]).includes(status)
        ? (status as ContactMessageStatus)
        : 'ALL'

    const { data: list, isLoading } = useQuery({
        queryKey: ['contact-messages', page, limit, statusFilter],
        queryFn: () =>
            listContactMessages({
                page,
                limit,
                ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
            }),
    })

    const { data: stats } = useQuery({
        queryKey: ['contact-stats'],
        queryFn: getContactStats,
    })

    const statusMutation = useMutation({
        mutationFn: ({ id, next }: { id: string; next: ContactMessageStatus }) => updateContactStatus(id, next),
        onSuccess: () => {
            toast.success('Message updated')
            queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
            queryClient.invalidateQueries({ queryKey: ['contact-stats'] })
        },
        onError: (error) => toast.error(error.message),
    })

    return (
        <SupportUI
            messages={list?.data ?? []}
            total={list?.meta.total ?? 0}
            unread={stats?.unread ?? 0}
            loading={isLoading}
            page={page}
            limit={limit}
            statusFilter={statusFilter}
            onStatusFilterChange={(next) =>
                mergeSearch({ status: next === 'ALL' ? undefined : next, page: 1 })
            }
            onStatusChange={(id, next) => statusMutation.mutate({ id, next })}
            statusPending={statusMutation.isPending}
            onReset={() => mergeSearch({ status: undefined, page: 1 })}
        />
    )
}
