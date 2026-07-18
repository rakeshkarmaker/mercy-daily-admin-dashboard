import { useMemo } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Activity, Calendar, HandHeart, Eye, Plus, CheckSquare } from 'lucide-react'
import type { Prayer } from '@/lib/prayer-management'
import { Button } from '@/components/ui/button'

export interface PrayerManagementUIProps {
    prayers: Prayer[]
    totalPrayers: number
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
    onCreatePrayer: () => void
}

export function PrayerManagementUI({
    prayers,
    totalPrayers,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
    onCreatePrayer,
}: PrayerManagementUIProps) {
    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Published', value: 'Published' },
                    { label: 'Scheduled', value: 'Scheduled' },
                ],
            },
            {
                id: 'scheduledDate',
                label: 'Scheduled Date',
                icon: Calendar,
                type: 'date',
            },
        ],
        []
    )

    const columns: DataTableColumn<Prayer>[] = useMemo(
        () => [
            { key: 'title', header: 'PRAYER TITLE', render: (row) => <span className="text-foreground font-semibold">{row.title}</span> },
            { key: 'category', header: 'CATEGORY', render: (row) => <span className="text-muted-foreground">{row.category}</span> },
            { key: 'bibleVerse', header: 'ASSIGNED BIBLE VERSE', render: (row) => <span className="text-muted-foreground">{row.bibleVerse}</span> },
            { 
                key: 'scheduledDate', 
                header: 'SCHEDULED DATE', 
                render: (row) => {
                    const dateStr = new Date(row.scheduledDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                    })
                    // Example mock output: 07 Jul 2026
                    return <span className="text-muted-foreground">{dateStr}</span>
                }
            },
            { key: 'author', header: 'AUTHOR', render: (row) => <span className="text-muted-foreground">{row.author}</span> },
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
                        <span className="flex items-center gap-1.5 text-info font-semibold text-sm">
                            <CheckSquare className="h-3.5 w-3.5" />
                            Scheduled
                        </span>
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
                <PageHeader title="Prayer Management" className="shrink-0 text-xl font-bold text-chart-1" />
                <div className="flex items-center flex-wrap gap-3">
                    <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search..." className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border" />
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                    <Button onClick={onCreatePrayer} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 h-9">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Prayer
                    </Button>
                </div>
            </div>

            <div className="flex flex-col">
                <DataTable
                    columns={columns}
                    data={prayers}
                    total={totalPrayers}
                    page={page}
                    limit={limit}
                    noun="prayers"
                    emptyIcon={<HandHeart className="h-6 w-6" />}
                    onReset={onResetSearch}
                />
            </div>
        </div>
    )
}
