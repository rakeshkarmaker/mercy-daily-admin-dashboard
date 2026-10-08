import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { PrayerManagementUI } from '@/components/features/prayer-management/prayer-management-ui'
import type { FilterState } from '@/components/shared/filter-builder'
import { languageFromFilters } from '@/lib/language'
import {
    createPrayer,
    deletePrayer,
    deleteSchedule,
    getPrayerTranslations,
    getTodayPrayer,
    listPrayers,
    listSchedules,
    recordPrayerView,
    schedulePrayer,
    updatePrayer,
    updateSchedule,
} from '@/api/dailyprayers'
import type { PrayerInput, PrayerTranslationsSync } from '@/api/dailyprayers'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    tab: z.enum(['today', 'library', 'schedules']).catch('today').optional(),
})

export const Route = createFileRoute('/__main/prayer-management')({
    validateSearch: searchSchema,
    component: PrayerManagementPage,
})

function PrayerManagementPage() {
    const { page = 1, limit = 10, search: searchQuery = '', tab = 'today' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    // Language comes from the shared Add Filter component — the `language`
    // select drives `?language=`; unset lists everything in its own language.
    const [filters, setFilters] = useState<FilterState[]>([])
    const language = languageFromFilters(filters)

    const { data, isLoading } = useQuery({
        queryKey: ['dailyprayers', page, limit, language ?? 'all'],
        queryFn: () => listPrayers({ page, limit, language }),
    })
    // Full library for the schedule pickers — the paged table only holds
    // the current page, but scheduling must offer every prayer.
    const { data: allPrayersData } = useQuery({
        queryKey: ['dailyprayers', 'all'],
        queryFn: () => listPrayers({ page: 1, limit: 1000 }).then((res) => res.data),
        staleTime: 5 * 60 * 1000,
    })
    const { data: schedules = [] } = useQuery({
        queryKey: ['dailyprayer-schedules'],
        queryFn: listSchedules,
    })
    const { data: todayPrayer, isLoading: isTodayLoading } = useQuery({
        queryKey: ['dailyprayers-today'],
        queryFn: () => getTodayPrayer(),
    })

    const prayers = useMemo(() => {
        const rows = data?.data ?? []
        const query = searchQuery.trim().toLowerCase()
        if (!query) return rows
        // Search spans the base (original-language) fields and every stored translation.
        return rows.filter((prayer) =>
            [prayer.verse, prayer.reference, prayer.reflection, prayer.prayer]
                .some((value) => value.toLowerCase().includes(query)) ||
            (prayer.translations ?? []).some((translation) =>
                [translation.verse, translation.reference, translation.reflection, translation.prayer]
                    .some((value) => value.toLowerCase().includes(query)),
            ),
        )
    }, [data?.data, searchQuery])

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['dailyprayers'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayer-schedules'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayers-today'] })
    }

    const createMutation = useMutation({
        mutationFn: ({ input, translations }: { input: PrayerInput; translations?: PrayerTranslationsSync }) =>
            createPrayer(input, translations),
        onSuccess: () => { toast.success('Prayer created'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, input, translations }: { id: number; input: Partial<PrayerInput>; translations?: PrayerTranslationsSync | null }) =>
            updatePrayer(id, input, translations),
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
    const updateScheduleMutation = useMutation({
        mutationFn: ({ id, input }: { id: number; input: { devotionId?: number; scheduledFor?: string } }) =>
            updateSchedule(id, input),
        onSuccess: () => { toast.success('Schedule override updated'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteScheduleMutation = useMutation({
        mutationFn: (id: number) => deleteSchedule(id),
        onSuccess: () => { toast.success('Schedule override removed'); invalidate() },
        onError: (error: Error) => toast.error(error.message),
    })

    return (
        <PrayerManagementUI
            prayers={prayers}
            libraryPrayers={allPrayersData ?? prayers}
            schedules={schedules}
            todayPrayer={todayPrayer}
            todayLoading={isTodayLoading}
            totalPrayers={data?.total ?? 0}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            activeTab={tab}
            onTabChange={(newTab) => mergeSearch({ tab: newTab === 'today' ? undefined : newTab, page: 1 })}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onCreatePrayer={(input, translations) =>
                createMutation.mutateAsync({ input, translations }).then(() => undefined)
            }
            onUpdatePrayer={(id, input, translations) =>
                updateMutation.mutateAsync({ id, input, translations }).then(() => undefined)
            }
            onFetchTranslations={(id) => getPrayerTranslations(id)}
            onDeletePrayer={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
            onRecordView={async (id) => {
                try {
                    await recordPrayerView(id)
                    invalidate()
                } catch {
                    // View counting is best-effort; never block the dialog.
                }
            }}
            onSchedulePrayer={(id, date) => scheduleMutation.mutateAsync({ id, date }).then(() => undefined)}
            onUpdateSchedule={(id, input) => updateScheduleMutation.mutateAsync({ id, input }).then(() => undefined)}
            onDeleteSchedule={(id) => deleteScheduleMutation.mutateAsync(id).then(() => undefined)}
        />
    )
}
