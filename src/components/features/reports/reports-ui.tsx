import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Check, FileText, Flag, Eye, MessageSquareWarning, Trash2 } from 'lucide-react'
import type { Report, ReportStatus } from '@/api/reports'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

type StatusTab = ReportStatus | 'ALL'

const STATUS_TABS: { value: StatusTab; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REVIEWED', label: 'Reviewed' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'DISMISSED', label: 'Dismissed' },
]

/** Short relative time for table cells (full date stays in the title tooltip). */
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    if (!Number.isFinite(diff) || diff < 0) return 'just now'
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
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
    /** Take down the reported content and auto-resolve the report. */
    onRemoveContent: (report: Pick<Report, 'id' | 'targetType' | 'targetId'>) => Promise<void>
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
    onRemoveContent,
}: ReportsUIProps) {
    const [viewing, setViewing] = useState<Report | null>(null)
    const [removing, setRemoving] = useState<Report | null>(null)
    const [removingBusy, setRemovingBusy] = useState(false)

    // Status lives in the tab strip (like the Sermons page); the filter
    // builder keeps only the date filter. Tabs read/write the same
    // `status` filter entry so the server query stays in sync.
    const activeStatusTab: StatusTab = useMemo(() => {
        const match = filters.find((f) => f.fieldId === 'status')
        if (!match || Array.isArray(match.value)) return 'ALL'
        const value = match.value.trim().toUpperCase()
        return (STATUS_TABS as { value: string }[]).some((t) => t.value === value) && value !== 'ALL'
            ? (value as ReportStatus)
            : 'ALL'
    }, [filters])

    const handleStatusTabChange = (tab: StatusTab) => {
        const rest = filters.filter((f) => f.fieldId !== 'status')
        if (tab === 'ALL') {
            onFiltersChange(rest)
            return
        }
        onFiltersChange([
            ...rest,
            {
                id: `status-tab-${tab}`,
                fieldId: 'status',
                condition: 'is',
                value: tab,
            },
        ])
    }

    const filterOptions: FilterOption[] = useMemo(
        () => [
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
                    <div className="flex min-w-0 max-w-90 items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 rounded-lg bg-warning/10 p-1.5 text-warning">
                            {row.targetType === 'POST' ? (
                                <FileText className="size-4" />
                            ) : (
                                <MessageSquareWarning className="size-4" />
                            )}
                        </span>
                        <span className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                                {row.targetSnippet
                                    ? row.targetSnippet.slice(0, 70)
                                    : '(content no longer available)'}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Badge variant="outline" className="h-4 px-1 text-[10px] font-semibold uppercase">
                                    {row.targetType.toLowerCase()}
                                </Badge>
                                <span className="inline-flex items-center gap-1">
                                    <span
                                        className={`inline-block size-1.5 rounded-full ${row.targetDeleted ? 'bg-muted-foreground' : 'bg-success'}`}
                                        aria-hidden
                                    />
                                    {row.targetDeleted ? 'removed' : 'live'}
                                </span>
                            </span>
                        </span>
                    </div>
                ),
            },
            {
                key: 'reason',
                header: 'REASON',
                render: (row) => (
                    <Badge variant="secondary" className="font-medium capitalize">
                        {row.reason.replaceAll('_', ' ').toLowerCase()}
                    </Badge>
                ),
            },
            {
                key: 'reporterName',
                header: 'REPORTER',
                render: (row) => (
                    <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {row.reporterName.charAt(0).toUpperCase()}
                        </span>
                        {row.reporterName}
                    </span>
                ),
            },
            {
                key: 'createdAt',
                header: 'REPORTED',
                render: (row) => (
                    <span className="whitespace-nowrap text-muted-foreground" title={formatFullDate(row.createdAt)}>
                        {timeAgo(row.createdAt)}
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
                render: (row) => {
                    const open = row.status === 'PENDING' || row.status === 'REVIEWED'
                    return (
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={() => setViewing(row)}
                                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                aria-label="View report"
                                title="Review report"
                            >
                                <Eye className="size-4" />
                            </button>
                            {open && !row.targetDeleted && (
                                <button
                                    onClick={() => setRemoving(row)}
                                    className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                                    aria-label="Remove reported content"
                                    title={`Remove this ${row.targetType.toLowerCase()} and resolve`}
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                            {open && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await onStatusChange(row.id, 'DISMISSED')
                                        } catch (error) {
                                            toast.error(error instanceof Error ? error.message : 'Update failed')
                                        }
                                    }}
                                    className="p-2 rounded-full text-success hover:bg-success/10 transition-colors"
                                    aria-label="Keep content, dismiss report"
                                    title="Keep content, dismiss report"
                                >
                                    <Check className="size-4" />
                                </button>
                            )}
                        </div>
                    )
                },
            },
        ],
        [onStatusChange],
    )

    return (
        <>
            <div className="flex flex-col w-full max-w-full relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <PageHeader
                        title="Reports"
                        description="Review reported posts and comments, and track moderation progress."
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

                <Tabs
                    value={activeStatusTab}
                    onValueChange={(value) => handleStatusTabChange(value as StatusTab)}
                    className="w-full"
                >
                    <TabsList variant="line" className="mb-3 w-full max-w-full justify-start overflow-x-auto border-b border-border/50">
                        {STATUS_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="flex-none px-4">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    {viewing && (
                        <>
                            <DialogHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-start gap-3 pr-6">
                                    <div className="rounded-xl bg-warning/10 p-2.5 text-warning">
                                        <Flag className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <DialogTitle className="text-lg capitalize">
                                            {viewing.targetType.toLowerCase()} report
                                        </DialogTitle>
                                        <DialogDescription>
                                            Reported by {viewing.reporterName} · {timeAgo(viewing.createdAt)}
                                        </DialogDescription>
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[viewing.status]}`}
                                            >
                                                {viewing.status.toLowerCase()}
                                            </span>
                                            <Badge variant="secondary" className="text-[11px] capitalize">
                                                {viewing.reason.replaceAll('_', ' ').toLowerCase()}
                                            </Badge>
                                            <Badge variant="outline" className="text-[11px] uppercase">
                                                {viewing.targetType.toLowerCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-1">
                                <section className="space-y-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Reported content
                                    </p>
                                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                                        {viewing.targetSnippet || 'The reported content is no longer available.'}
                                    </div>
                                </section>

                                {viewing.details && (
                                    <section className="space-y-1.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Reporter notes
                                        </p>
                                        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
                                            {viewing.details}
                                        </p>
                                    </section>
                                )}

                            {/* Content decision: take down or keep. Status-only moves stay in the footer. */}
                            {(viewing.status === 'PENDING' || viewing.status === 'REVIEWED') && (
                                <section className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Moderate this {viewing.targetType.toLowerCase()}
                                    </p>
                                    {viewing.targetDeleted ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Already removed — resolving just closes the report.
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Removing hides it from all feeds (recoverable soft-delete).
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={removingBusy}
                                            onClick={async () => {
                                                setRemovingBusy(true)
                                                try {
                                                    await onRemoveContent(viewing)
                                                    setViewing((current) =>
                                                        current ? { ...current, status: 'RESOLVED', targetDeleted: true } : current,
                                                    )
                                                } catch (error) {
                                                    toast.error(error instanceof Error ? error.message : 'Removal failed')
                                                } finally {
                                                    setRemovingBusy(false)
                                                }
                                            }}
                                        >
                                            <Trash2 className="mr-1.5 size-3.5" />
                                            Remove {viewing.targetType.toLowerCase()} & resolve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={async () => {
                                                try {
                                                    await onStatusChange(viewing.id, 'DISMISSED')
                                                    setViewing((current) =>
                                                        current ? { ...current, status: 'DISMISSED' } : current,
                                                    )
                                                } catch (error) {
                                                    toast.error(error instanceof Error ? error.message : 'Update failed')
                                                }
                                            }}
                                        >
                                            <Check className="mr-1.5 size-3.5" />
                                            Keep content & dismiss
                                        </Button>
                                    </div>
                                </section>
                            )}
                            </div>

                            <DialogFooter className="border-t border-border/50 pt-3">
                                {NEXT_STATUSES[viewing.status].length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="mr-auto text-xs text-muted-foreground">Triage without content action:</span>
                                        {NEXT_STATUSES[viewing.status].map((next) => (
                                            <Button
                                                key={next}
                                                size="sm"
                                                variant={next === 'DISMISSED' ? 'ghost' : 'outline'}
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
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        This report is closed.
                                    </span>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Row-level remove goes through the same confirm + auto-resolve. */}
            <TrashConfirm
                open={removing !== null}
                onOpenChange={(open) => !open && !removingBusy && setRemoving(null)}
                title="Remove reported content?"
                description="This hides the reported content from all feeds and resolves the report:"
                name={removing ? `this ${removing.targetType.toLowerCase()} (${removing.reason.replaceAll('_', ' ').toLowerCase()})` : 'this content'}
                reversibilityNote="This hides it from all feeds (soft-delete, recoverable)."
                onConfirm={async () => {
                    if (!removing) return
                    setRemovingBusy(true)
                    try {
                        await onRemoveContent(removing)
                    } finally {
                        setRemovingBusy(false)
                        setRemoving(null)
                    }
                }}
            />
        </>
    )
}
