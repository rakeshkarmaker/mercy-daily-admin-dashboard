import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Activity, Calendar, Flag, Eye } from 'lucide-react'
import type { Report, ReportStatus } from '@/api/reports'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const STATUS_STYLES: Record<ReportStatus, string> = {
    PENDING: 'bg-warning/10 text-warning',
    REVIEWED: 'bg-info/10 text-info',
    RESOLVED: 'bg-success/10 text-success',
    DISMISSED: 'bg-muted text-muted-foreground',
}

/** Allowed transitions (mirrors the backend lifecycle). */
const NEXT_STATUSES: Record<ReportStatus, ReportStatus[]> = {
    PENDING: ['REVIEWED', 'RESOLVED', 'DISMISSED'],
    REVIEWED: ['RESOLVED', 'DISMISSED'],
    RESOLVED: [],
    DISMISSED: [],
}

export interface ReportsUIProps {
    reports: Report[]
    totalReports: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
    onStatusChange: (id: string, status: ReportStatus) => Promise<void>
}

export function ReportsUI({
    reports,
    totalReports,
    loading = false,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
    onStatusChange,
}: ReportsUIProps) {
    const [viewing, setViewing] = useState<Report | null>(null)

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Reviewed', value: 'REVIEWED' },
                    { label: 'Resolved', value: 'RESOLVED' },
                    { label: 'Dismissed', value: 'DISMISSED' },
                ],
            },
            {
                id: 'createdAt',
                label: 'Reported Date',
                icon: Calendar,
                type: 'date',
            },
        ],
        [],
    )

    const columns: DataTableColumn<Report>[] = useMemo(
        () => [
            {
                key: 'target',
                header: 'REPORTED CONTENT',
                render: (row) => (
                    <div className="flex flex-col max-w-90">
                        <span className="text-foreground font-medium truncate">
                            {row.targetSnippet
                                ? row.targetSnippet.slice(0, 70)
                                : '(content no longer available)'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {row.targetType.toLowerCase()} ·{' '}
                            {row.targetDeleted ? 'deleted' : 'live'}
                        </span>
                    </div>
                ),
            },
            {
                key: 'reason',
                header: 'REASON',
                render: (row) => (
                    <span className="text-muted-foreground font-medium">
                        {row.reason.replaceAll('_', ' ').toLowerCase()}
                    </span>
                ),
            },
            {
                key: 'reporterName',
                header: 'REPORTER',
                render: (row) => (
                    <span className="text-muted-foreground">{row.reporterName}</span>
                ),
            },
            {
                key: 'createdAt',
                header: 'DATE',
                render: (row) => (
                    <span className="text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => (
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[row.status]}`}
                    >
                        {row.status.toLowerCase()}
                    </span>
                ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setViewing(row)}
                            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            aria-label="View report"
                        >
                            <Eye className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    )

    return (
        <>
            <div className="flex flex-col w-full max-w-full relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <PageHeader
                        title="Reports"
                        className="shrink-0 text-xl font-bold text-chart-1"
                    />
                    <div className="flex items-center flex-wrap gap-3">
                        <SearchInput
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            placeholder="Search reports..."
                            className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border"
                        />
                        <FilterBuilder
                            options={filterOptions}
                            filters={filters}
                            onFiltersChange={onFiltersChange}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={reports}
                    loading={loading}
                    total={totalReports}
                    page={page}
                    limit={limit}
                    noun="reports"
                    emptyIcon={<Flag className="h-6 w-6" />}
                    onReset={onResetSearch}
                />
            </div>

            {/* Moderation detail + status actions */}
            <Dialog
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) setViewing(null)
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    {viewing && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="capitalize">
                                    {viewing.targetType} report ·{' '}
                                    {viewing.reason.replaceAll('_', ' ').toLowerCase()}
                                </DialogTitle>
                                <DialogDescription>
                                    Reported by {viewing.reporterName} on{' '}
                                    {new Date(viewing.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                                {viewing.targetSnippet ||
                                    'The reported content is no longer available.'}
                            </div>

                            {viewing.details && (
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        Reporter notes:{' '}
                                    </span>
                                    {viewing.details}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                                {NEXT_STATUSES[viewing.status].length > 0 ? (
                                    NEXT_STATUSES[viewing.status].map((next) => (
                                        <Button
                                            key={next}
                                            size="sm"
                                            variant={next === 'DISMISSED' ? 'ghost' : 'default'}
                                            onClick={async () => {
                                                try {
                                                    await onStatusChange(viewing.id, next)
                                                    setViewing((current) =>
                                                        current
                                                            ? { ...current, status: next }
                                                            : current,
                                                    )
                                                } catch (error) {
                                                    toast.error(
                                                        error instanceof Error
                                                            ? error.message
                                                            : 'Update failed',
                                                    )
                                                }
                                            }}
                                        >
                                            Mark {next.toLowerCase()}
                                        </Button>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        This report is closed.
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
