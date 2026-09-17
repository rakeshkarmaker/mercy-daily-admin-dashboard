import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { ReportsUI } from '@/components/features/reports/reports-ui'
import { listReports, toUiReport, updateReportStatus } from '@/api/reports'
import type { FilterState } from '@/components/shared/filter-builder'
import type { ReportStatus } from '@/api/reports'
import { useMemo, useState } from 'react'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    filters: z.string().catch('[]').optional(),
})

export const Route = createFileRoute('/__main/reports')({
    validateSearch: searchSchema,
    component: ReportsPage,
})

function ReportsPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState<FilterState[]>([])

    const { data: list = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['reports', page, limit],
        queryFn: () => listReports({ page, limit }),
    })

    const reports = useMemo(() => list.data.map(toUiReport), [list.data])

    // Status filter is applied server-side via query param when a single
    // status filter is chosen; client-side filtering covers text/dates.
    const filtered = useMemo(() => {
        let result = reports
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (r) =>
                    r.targetSnippet.toLowerCase().includes(q) ||
                    r.reporterName.toLowerCase().includes(q) ||
                    r.reason.toLowerCase().includes(q),
            )
        }
        if (filters.length > 0) {
            result = result.filter((r) => {
                for (const { fieldId, condition, value } of filters) {
                    const contentValue = r[fieldId as keyof typeof r]
                    if (contentValue === undefined) continue
                    const valStr = String(contentValue).toLowerCase()
                    const filterValStr = String(value).toLowerCase()
                    if (condition === 'is exactly' || condition === 'is') {
                        if (valStr !== filterValStr) return false
                    } else if (condition === 'contains') {
                        if (!valStr.includes(filterValStr)) return false
                    } else if (condition === 'is before') {
                        if (valStr >= filterValStr) return false
                    } else if (condition === 'is after') {
                        if (valStr <= filterValStr) return false
                    }
                }
                return true
            })
        }
        return result
    }, [reports, searchQuery, filters])

    const handleStatusChange = async (id: string, status: ReportStatus) => {
        await updateReportStatus(id, status)
        queryClient.invalidateQueries({ queryKey: ['reports'] })
    }

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined, page: 1 })
        setFilters([])
    }

    return (
        <ReportsUI
            reports={filtered}
            totalReports={list.total}
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
            onStatusChange={handleStatusChange}
        />
    )
}
