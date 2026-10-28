import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { ReportsUI } from '@/components/features/reports/reports-ui'
import { listReports, toUiReport, updateReportStatus, removeContentAndResolve } from '@/api/reports'
import { toast } from 'sonner'
import type { FilterState } from '@/components/shared/filter-builder'
import type { ReportStatus, ReportTargetType } from '@/api/reports'
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

/** Status comes from the shared Add Filter component; unset means all statuses. */
function statusFromFilters(filters: FilterState[]): ReportStatus | undefined {
    const match = filters.find((f) => f.fieldId === 'status')
    if (!match || Array.isArray(match.value)) return undefined
    const value = match.value.trim().toUpperCase()
    return value === 'PENDING' || value === 'REVIEWED' || value === 'RESOLVED' || value === 'DISMISSED'
        ? value
        : undefined
}

function ReportsPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState<FilterState[]>([])
    // Status + text search run server-side so every page is covered (the
    // previous client-only filtering silently missed rows past page one).
    // The date filter below stays client-side on the loaded page.
    const status = statusFromFilters(filters)
    const search = searchQuery.trim() || undefined

    const { data: list = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['reports', page, limit, status ?? 'all', search ?? ''],
        queryFn: () => listReports({ page, limit, status, search }),
    })

    const reports = useMemo(() => list.data.map(toUiReport), [list.data])

    // Reason + date filtering covers the loaded page; status/search already
    // ran server-side (re-applied here harmlessly for reason text).
    const filtered = useMemo(() => {
        let result = reports
        if (search) {
            const q = search.toLowerCase()
            result = result.filter((r) => r.reason.toLowerCase().includes(q))
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

    const handleRemoveContent = async (report: { id: string; targetType: ReportTargetType; targetId: string }) => {
        try {
            await removeContentAndResolve(report.id, report.targetType, report.targetId)
            toast.success('Content removed and report resolved')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Removal failed')
        }
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
            onRemoveContent={handleRemoveContent}
        />
    )
}
