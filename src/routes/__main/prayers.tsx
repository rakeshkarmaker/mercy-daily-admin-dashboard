import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSearchParams } from '@/hooks/use-search-params'
import { PrayersUI } from '@/components/features/prayers/prayers-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    listAdminPrayers,
    createAdminPrayer,
    updateAdminPrayer,
    deleteAdminPrayer,
    prayForPrayer,
    type AdminCreatePrayerInput,
    type AdminUpdatePrayerInput,
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
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'answered' | 'deleted'>(tab)
    const queryClient = useQueryClient()

    // Determine query filter params based on activeTab
    const queryParams = {
        page,
        limit,
        search: searchQuery || undefined,
        isAnswered: activeTab === 'answered' ? true : undefined,
        includeDeleted: activeTab === 'deleted' ? true : undefined,
    }

    const { data: response = { items: [], total: 0, page: 1, limit: 10, totalPages: 1 }, isLoading } = useQuery({
        queryKey: ['prayers-admin', page, limit, searchQuery, activeTab],
        queryFn: () => listAdminPrayers(queryParams),
    })

    // Filter active items client-side if activeTab is 'active' (not answered, not deleted)
    const prayers = activeTab === 'active'
        ? response.items.filter((p) => !p.isAnswered && !p.deletedAt)
        : activeTab === 'deleted'
        ? response.items.filter((p) => p.deletedAt)
        : response.items

    const createMutation = useMutation({
        mutationFn: (input: AdminCreatePrayerInput) => createAdminPrayer(input),
        onSuccess: () => {
            toast.success('Prayer request created successfully')
            queryClient.invalidateQueries({ queryKey: ['prayers-admin'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: AdminUpdatePrayerInput }) =>
            updateAdminPrayer(id, input),
        onSuccess: () => {
            toast.success('Prayer updated successfully')
            queryClient.invalidateQueries({ queryKey: ['prayers-admin'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: ({ id, hard }: { id: string; hard?: boolean }) =>
            deleteAdminPrayer(id, hard),
        onSuccess: () => {
            toast.success('Prayer removed successfully')
            queryClient.invalidateQueries({ queryKey: ['prayers-admin'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const prayMutation = useMutation({
        mutationFn: (id: string) => prayForPrayer(id),
        onSuccess: () => {
            toast.success('Prayer recorded!')
            queryClient.invalidateQueries({ queryKey: ['prayers-admin'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined, page: 1 })
    }

    const handleTabChange = (newTab: 'all' | 'active' | 'answered' | 'deleted') => {
        setActiveTab(newTab)
        mergeSearch({ tab: newTab === 'all' ? undefined : newTab, page: 1 })
    }

    return (
        <PrayersUI
            prayers={prayers}
            totalPrayers={response.total}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSearchChange={handleSearchChange}
            onResetSearch={handleResetSearch}
            onCreatePrayer={(input) => createMutation.mutateAsync(input).then(() => {})}
            onUpdatePrayer={(id, input) => updateMutation.mutateAsync({ id, input }).then(() => {})}
            onDeletePrayer={(id, hard) => deleteMutation.mutateAsync({ id, hard }).then(() => {})}
            onPrayForPrayer={(id) => prayMutation.mutateAsync(id).then(() => {})}
        />
    )
}
