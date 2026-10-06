import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { PrayerManagementUI } from '@/components/features/prayer-management/prayer-management-ui'
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
import type { PrayerInput, PrayerLanguage, PrayerTranslationsSync } from '@/api/dailyprayers'

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

    // Active content language — the server projects it onto every row
    // (single shared Language enum: en|esp|por).
    const [language, setLanguage] = useState<PrayerLanguage>('en')

    const { data, isLoading } = useQuery({
        queryKey: ['dailyprayers', page, limit, language],
        queryFn: () => listPrayers({ page, limit, language }),
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
        // Search spans the base (English) fields and every stored translation.
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
            schedules={schedules}
            todayPrayer={todayPrayer}
            todayLoading={isTodayLoading}
            totalPrayers={data?.total ?? 0}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            language={language}
            onLanguageChange={setLanguage}
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
            onCheckTranslation={async (reference, language) => {
                const page = await listPrayers({ page: 1, limit: 100 })
                const query = reference.trim().toLowerCase()
                const base = page.data.find((p) => p.reference.toLowerCase() === query)
                if (!base) return null
                const translations = await getPrayerTranslations(base.id)
                return translations.some((t) => t.language === language) ? base : null
            }}
            onCheckBaseContent={async (reference) => {
                const page = await listPrayers({ page: 1, limit: 100 })
                const query = reference.trim().toLowerCase()
                return page.data.find((p) => p.reference.toLowerCase() === query) ?? null
            }}
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
