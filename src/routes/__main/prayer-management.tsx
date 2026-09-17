import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { PrayerManagementUI } from '@/components/features/prayer-management/prayer-management-ui'
import { createPrayer, deletePrayer, listPrayers, listSchedules, schedulePrayer, updatePrayer } from '@/api/dailyprayers'
import type { PrayerInput } from '@/api/dailyprayers'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/prayer-management')({
    validateSearch: searchSchema,
    component: PrayerManagementPage,
})

function PrayerManagementPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['dailyprayers', page, limit],
        queryFn: () => listPrayers({ page, limit }),
    })
    const { data: schedules = [] } = useQuery({
        queryKey: ['dailyprayer-schedules'],
        queryFn: listSchedules,
    })

    const prayers = useMemo(() => {
        const rows = data?.data ?? []
        const query = searchQuery.trim().toLowerCase()
        if (!query) return rows
        return rows.filter((prayer) =>
            [prayer.verse, prayer.reference, prayer.reflection, prayer.prayer]
                .some((value) => value.toLowerCase().includes(query)),
        )
    }, [data?.data, searchQuery])

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['dailyprayers'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayer-schedules'] })
    }

    const createMutation = useMutation({
        mutationFn: (input: PrayerInput) => createPrayer(input),
        onSuccess: () => { toast.success('Prayer created'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: number; input: Partial<PrayerInput> }) => updatePrayer(id, input),
        onSuccess: () => { toast.success('Prayer updated'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: number) => deletePrayer(id),
        onSuccess: () => { toast.success('Prayer deleted'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })
    const scheduleMutation = useMutation({
        mutationFn: ({ id, date }: { id: number; date: string }) => schedulePrayer(id, date),
        onSuccess: (_, variables) => { toast.success(`Prayer scheduled for ${variables.date}`); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })

    return (
        <PrayerManagementUI
            prayers={prayers}
            schedules={schedules}
            totalPrayers={data?.total ?? 0}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onCreatePrayer={(input) => createMutation.mutateAsync(input).then(() => undefined)}
            onUpdatePrayer={(id, input) => updateMutation.mutateAsync({ id, input }).then(() => undefined)}
            onDeletePrayer={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
            onSchedulePrayer={(id, date) => scheduleMutation.mutateAsync({ id, date }).then(() => undefined)}
        />
    )
}
