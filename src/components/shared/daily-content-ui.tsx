import { useMemo } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Activity, Calendar, ClipboardList, Eye } from 'lucide-react'
import type { DailyContent } from '@/lib/daily-content'

export interface DailyContentUIProps {
    contents: DailyContent[]
    totalContents: number
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
}

export function DailyContentUI({
    contents,
    totalContents,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
}: DailyContentUIProps) {
    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Published', value: 'Published' },
                    { label: 'Draft', value: 'Draft' },
                    { label: 'Scheduled', value: 'Scheduled' },
                ],
            },
            {
                id: 'scheduledDate',
                label: 'Scheduled Date',
                icon: Calendar,
                type: 'date',
            },
            {
                id: 'lastUpdated',
                label: 'Last Updated',
                icon: Calendar,
                type: 'date',
            },
        ],
        []
    )

    const columns: DataTableColumn<DailyContent>[] = useMemo(
        () => [
            { key: 'contentType', header: 'CONTENT TYPE', render: (row) => <span className="text-foreground font-semibold">{row.contentType}</span> },
            { key: 'title', header: 'TITLE', render: (row) => <span className="text-muted-foreground">{row.title}</span> },
            { key: 'category', header: 'CATEGORY', render: (row) => <span className="text-muted-foreground">{row.category}</span> },
            { key: 'scheduledDate', header: 'SCHEDULED DATE', render: (row) => <span className="text-muted-foreground">{row.scheduledDate}</span> },
            { key: 'lastUpdated', header: 'LAST UPDATED', render: (row) => <span className="text-muted-foreground">{row.lastUpdated}</span> },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) =>
                    row.status === 'Published' ? (
                        <span className="flex items-center gap-1.5 text-success font-semibold text-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Published
                        </span>
                    ) : (
                        <span className="text-muted-foreground font-semibold text-sm">{row.status}</span>
                    ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex justify-center">
                        <button className="p-2 rounded-full bg-orange-50 text-orange-400 hover:bg-orange-100 transition-colors">
                            <Eye className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        []
    )

    return (
        <div className="flex flex-col w-full max-w-full relative">
            {/* Header & Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <PageHeader title="Content" className="shrink-0 text-xl font-bold text-chart-1" />
                <div className="flex items-center flex-wrap gap-3">
                    <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search..." className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border" />
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                </div>
            </div>

            <div className="flex flex-col">
                <DataTable
                    columns={columns}
                    data={contents}
                    total={totalContents}
                    page={page}
                    limit={limit}
                    noun="content items"
                    emptyIcon={<ClipboardList className="h-6 w-6" />}
                    onReset={onResetSearch}
                />
            </div>
        </div>
    )
}
