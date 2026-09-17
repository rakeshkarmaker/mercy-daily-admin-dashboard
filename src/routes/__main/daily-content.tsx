import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useSearchParams } from '@/hooks/use-search-params'
import { DailyContentUI } from '@/components/features/daily-content/daily-content-ui'
import { useQuery } from '@tanstack/react-query'
import { request } from '@/api/base'
import type { FilterState } from '@/components/shared/filter-builder'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    filters: z.string().catch('[]').optional(),
})

export const Route = createFileRoute('/__main/daily-content')({
    validateSearch: searchSchema,
    component: DailyContentPage,
})

interface TodayPrayer {
    date: string
    verse: string
    reference: string
    reflection: string
    prayer: string
}

function DailyContentPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const [filters, setFilters] = useState<FilterState[]>([])

    const { data: prayer, isLoading } = useQuery<TodayPrayer>({
        queryKey: ['dailyprayers-today'],
        queryFn: () => request<TodayPrayer>('/dailyprayers/today'),
    })

    const allContents = useMemo(() => {
        if (!prayer) return []
        return [
            {
                id: 1,
                contentType: 'Bible Verse' as const,
                title: prayer.verse,
                category: 'Daily Verse' as const,
                scheduledDate: prayer.date,
                lastUpdated: prayer.date,
                status: 'Published' as const,
            },
            {
                id: 2,
                contentType: 'Prayer' as const,
                title: prayer.prayer,
                category: 'Daily Prayer' as const,
                scheduledDate: prayer.date,
                lastUpdated: prayer.date,
                status: 'Published' as const,
            },
            {
                id: 3,
                contentType: 'Quote' as const,
                title: prayer.reflection,
                category: 'Inspiration' as const,
                scheduledDate: prayer.date,
                lastUpdated: prayer.date,
                status: 'Published' as const,
            },
        ]
    }, [prayer])

    const filteredContent = useMemo(() => {
        let result = allContents

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (c) =>
                    c.title.toLowerCase().includes(query) ||
                    c.contentType.toLowerCase().includes(query) ||
                    c.category.toLowerCase().includes(query)
            )
        }

        if (filters.length > 0) {
            result = result.filter((content) => {
                for (const filter of filters) {
                    const { fieldId, condition, value } = filter
                    const contentValue = content[fieldId as keyof typeof content]
                    if (contentValue === undefined) continue
                    const valStr = String(contentValue).toLowerCase()
                    const filterValStr = String(value).toLowerCase()
                    if (!value && !['is empty', 'is not empty'].includes(condition)) continue
                    if (condition === 'is empty') { if (valStr.trim() !== '') return false; continue }
                    if (condition === 'is not empty') { if (valStr.trim() === '') return false; continue }
                    if (condition === 'is exactly' || condition === 'is' || condition === '=') { if (valStr !== filterValStr) return false }
                    else if (condition === 'is not exactly' || condition === 'is not' || condition === '!=') { if (valStr === filterValStr) return false }
                    else if (condition === 'contains') { if (!valStr.includes(filterValStr)) return false }
                    else if (condition === 'does not contain') { if (valStr.includes(filterValStr)) return false }
                }
                return true
            })
        }

        return result
    }, [searchQuery, filters, allContents])

    const paginatedContent = useMemo(() => {
        const start = (page - 1) * limit
        return filteredContent.slice(start, start + limit)
    }, [filteredContent, page, limit])

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined, page: 1 })
        setFilters([])
    }

    return (
        <DailyContentUI
            contents={paginatedContent}
            totalContents={filteredContent.length}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={(f) => {
                setFilters(f)
                mergeSearch({ page: 1 })
            }}
            onResetSearch={handleResetSearch}
        />
    )
}
