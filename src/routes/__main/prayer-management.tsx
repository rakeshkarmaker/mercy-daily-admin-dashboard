import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { PrayerManagementUI } from '@/components/features/prayer-management/prayer-management-ui'
import type { FilterState } from '@/components/shared/filter-builder'
import { languageFromFilters } from '@/lib/language'
import { getPreview } from '@/api/dailyprayers'

/** Shift a YYYY-MM-DD date by n days. */
function addDays(dateStr: string, n: number): string {
    return new Date(new Date(`${dateStr}T00:00:00Z`).getTime() + n * 86400000)
        .toISOString()
        .slice(0, 10)
}

/**
 * Display-date window from Add Filter state. A range resolves to the
 * prayers those dates will display (override or rotation pick, per the
 * server preview) — this is what makes a date filter meaningful when the
 * default serving rule is sequential rotation. Unset when unused.
 */
function displayRangeFromFilters(filters: FilterState[]): [string, string] | undefined {
    const match = filters.find((f) => f.fieldId === 'displayDate')
    if (!match) return undefined
    const day = (v: unknown) =>
        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : ''
    if (match.condition === 'is between' && Array.isArray(match.value)) {
        let [a, b] = [day(match.value[0]), day(match.value[1])]
        if (!a || !b) return undefined
        if (a > b) [a, b] = [b, a]
        if (Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000) > 30) {
            b = addDays(a, 30)
        }
        return [a, b]
    }
    const d = day(match.value)
    if (!d) return undefined
    if (match.condition === 'is before') return [addDays(d, -30), d]
    if (match.condition === 'is after') return [d, addDays(d, 30)]
    return [d, d]
}

/** Scheduled filter from Add Filter state: which library rows hold a date override. */
function scheduledFromFilters(filters: FilterState[]): 'scheduled' | 'unscheduled' | undefined {
    const match = filters.find((f) => f.fieldId === 'scheduled')
    if (!match || Array.isArray(match.value)) return undefined
    const value = match.value.trim().toLowerCase()
    const negate = ['is not', 'is not exactly', '!='].includes(match.condition)
    if (value !== 'scheduled' && value !== 'unscheduled') return undefined
    if (!negate) return value
    return value === 'scheduled' ? 'unscheduled' : 'scheduled'
}

/** Whether a row's updated day satisfies the `updatedAt` date filter. */
function updatedDateMatches(updatedAt: string, filter: FilterState): boolean {
    const day = updatedAt.slice(0, 10)
    const { condition, value } = filter
    if (condition === 'is empty') return false
    if (condition === 'is not empty') return true
    if (Array.isArray(value)) {
        if (condition !== 'is between') return true
        const [from, to] = value
        if (!from || !to) return true
        return day >= from.slice(0, 10) && day <= to.slice(0, 10)
    }
    const date = value.trim().slice(0, 10)
    if (!date) return true
    if (condition === 'is before') return day < date
    if (condition === 'is after') return day > date
    return day === date
}
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
    // Display-date filter: resolve the range to prayer ids through the
    // server preview (override or rotation), then show those prayers.
    const displayRange = displayRangeFromFilters(filters)
    const { data: previewDays = [] } = useQuery({
        queryKey: ['dailyprayers-preview', displayRange?.[0], displayRange?.[1], language ?? 'all'],
        queryFn: () => getPreview(displayRange![0], displayRange![1], language),
        enabled: Boolean(displayRange),
    })

    const prayers = useMemo(() => {
        // Display-date filter active: the candidate set is the deduped
        // prayers those dates resolve to (in date order), not the page.
        const rows = displayRange
            ? (() => {
                const seen = new Set<number>()
                return previewDays.flatMap((d) => {
                    if (seen.has(d.prayer.id)) return []
                    seen.add(d.prayer.id)
                    return [d.prayer]
                })
            })()
            : (data?.data ?? [])
        const query = searchQuery.trim().toLowerCase()
        // Library Add Filter: scheduled status (via the overrides list) + updated date.
        const scheduledIds = new Set(schedules.map((s) => s.prayer.id))
        const scheduled = scheduledFromFilters(filters)
        const updatedFilter = filters.find((f) => f.fieldId === 'updatedAt')
        return rows.filter((prayer) => {
            if (scheduled === 'scheduled' && !scheduledIds.has(prayer.id)) return false
            if (scheduled === 'unscheduled' && scheduledIds.has(prayer.id)) return false
            if (updatedFilter && !updatedDateMatches(prayer.updatedAt, updatedFilter)) return false
            if (!query) return true
            // Search spans the base (original-language) fields and every stored translation.
            return [prayer.verse, prayer.reference, prayer.reflection, prayer.prayer]
                .some((value) => value.toLowerCase().includes(query)) ||
            (prayer.translations ?? []).some((translation) =>
                [translation.verse, translation.reference, translation.reflection, translation.prayer]
                    .some((value) => value.toLowerCase().includes(query)),
            )
        })
    }, [data?.data, searchQuery, filters, schedules, displayRange, previewDays])

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['dailyprayers'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayer-schedules'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayers-today'] })
        queryClient.invalidateQueries({ queryKey: ['dailyprayers-preview'] })
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
            prayers={displayRange ? prayers.slice((page - 1) * limit, page * limit) : prayers}
            libraryPrayers={allPrayersData ?? prayers}
            schedules={schedules}
            todayPrayer={todayPrayer}
            todayLoading={isTodayLoading}
            totalPrayers={displayRange ? prayers.length : (data?.total ?? 0)}
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
