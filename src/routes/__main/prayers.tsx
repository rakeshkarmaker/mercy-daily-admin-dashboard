import { createFileRoute } from '@tanstack/react-router'
import { useSearchParams } from '@/hooks/use-search-params'
import { PrayersUI } from '@/components/features/prayers/prayers-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listAdminPrayers,
    createAdminPrayer,
    updateAdminPrayer,
    deleteAdminPrayer,
    prayForPrayer,
} from '@/api/prayers'
import type {
    AdminCreatePrayerInput,
    AdminUpdatePrayerInput,
} from '@/api/prayers'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    tab: z.enum(['all', 'active', 'answered', 'deleted']).catch('all').optional(),
})

export const Route = createFileRoute('/__main/prayers')({
    validateSearch: searchSchema,
    component: PrayersPage,
})

function PrayersPage() {
    const { page = 1, limit = 10, search: searchQuery = '', tab = 'all' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const queryParams = {
        page,
        limit,
        search: searchQuery || undefined,
        isAnswered: tab === 'answered' ? true : tab === 'active' ? false : undefined,
        includeDeleted: tab === 'deleted' || tab === 'all' ? true : undefined,
    }

    const { data: response = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 }, isLoading } = useQuery({
        queryKey: ['prayers-admin', page, limit, searchQuery, tab],
        queryFn: () => listAdminPrayers(queryParams),
    })

    // Filter items client-side if tab is 'active' or 'deleted' for consistent view
    const prayers = tab === 'active'
        ? response.items.filter((p) => !p.isAnswered && !p.deletedAt)
        : tab === 'deleted'
        ? response.items.filter((p) => p.deletedAt)
        : tab === 'answered'
        ? response.items.filter((p) => p.isAnswered)
        : response.items

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['prayers-admin'] })

    const createMutation = useMutation({
        mutationFn: (input: AdminCreatePrayerInput) => createAdminPrayer(input),
        onSuccess: () => {
            toast.success('Prayer request created')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: AdminUpdatePrayerInput }) =>
            updateAdminPrayer(id, input),
        onSuccess: () => {
            toast.success('Prayer updated')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
            deleteAdminPrayer(id, hard),
        onSuccess: () => {
            toast.success('Prayer removed')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const prayMutation = useMutation({
        mutationFn: (id: string) => prayForPrayer(id),
        onSuccess: () => {
            toast.success('Prayer counted!')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    return (
        <PrayersUI
            prayers={prayers}
            totalPrayers={response.total}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            activeTab={tab}
            onTabChange={(newTab) => mergeSearch({ tab: newTab === 'all' ? undefined : newTab, page: 1 })}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onCreatePrayer={(input) => createMutation.mutateAsync(input).then(() => {})}
            onUpdatePrayer={(id, input) => updateMutation.mutateAsync({ id, input }).then(() => {})}
            onDeletePrayer={(id, hard) => deleteMutation.mutateAsync({ id, hard }).then(() => {})}
            onPrayForPrayer={(id) => prayMutation.mutateAsync(id).then(() => {})}
        />
    )
}
