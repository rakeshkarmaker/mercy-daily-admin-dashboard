import { Button } from '@/components/ui/button'
import { PaginationComp } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSearchParams } from '@/hooks/use-search-params'
import { SearchX } from 'lucide-react'

export type DataTableColumn<T> = {
    key: string
    header: string
    render: (row: T) => React.ReactNode
    className?: string
}

type DataTableProps<T> = {
    loading?: boolean
    columns: DataTableColumn<T>[]
    data: T[]
    noun?: string
    emptyIcon?: React.ReactNode
    page?: number
    limit?: number
    total?: number
    limitOptions?: number[]
    onReset?: () => void
}

function DataTable<T>({
    loading = false,
    columns,
    data,
    noun = 'rows',
    emptyIcon,
    page = 1,
    limit = 10,
    total = 0,
    limitOptions = [5, 10, 20],
    onReset,
}: DataTableProps<T>) {
    const mergeSearch = useSearchParams()

    if (loading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col.key}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, rowIdx) => (
                        <TableRow key={rowIdx} className="hover:bg-transparent">
                            {columns.map((col, colIdx) => (
                                <TableCell key={col.key} className={col.className}>
                                    <div
                                        className="h-4 rounded-md bg-muted/70 animate-pulse"
                                        style={{
                                            width: colIdx === 0 ? '55%' : colIdx === columns.length - 1 ? '30%' : '70%',
                                            animationDelay: `${rowIdx * 80 + colIdx * 40}ms`,
                                        }}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="p-3 rounded-full bg-muted/80 text-muted-foreground">
                    {emptyIcon ?? <SearchX className="h-6 w-6" />}
                </div>
                <div className="max-w-xs">
                    <h3 className="font-semibold text-foreground">No {noun} found</h3>
                    <p className="text-sm text-muted-foreground">
                        No records matched your search query or active filters. Try clearing your parameters!
                    </p>
                </div>
                {onReset && (
                    <Button variant="outline" size="sm" onClick={onReset}>
                        Reset Filters
                    </Button>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="max-w-full overflow-x-auto rounded-lg border border-border">
                <Table>
                    <TableHeader className="bg-primary [&_th]:text-primary-foreground [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th:first-child]:rounded-tl-md [&_th:last-child]:rounded-tr-md">
                        <TableRow className="hover:bg-transparent border-0">
                            {columns.map((col) => (
                                <TableHead key={col.key}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={index}>
                                {columns.map((col) => (
                                    <TableCell key={col.key} className={col.className}>
                                        {col.render(row)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <DataTableFooter
                page={page}
                limit={limit}
                total={total}
                onPageChange={(page) => mergeSearch({ page })}
                onLimitChange={(limit) => mergeSearch({ page: 1, limit })}
                limitOptions={limitOptions}
                noun={noun}
            />
        </>
    )
}

type DataTableFooterProps = {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
    limitOptions?: number[]
    noun?: string
}

function DataTableFooter({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
    limitOptions = [5, 10, 20],
    noun = 'rows',
}: DataTableFooterProps) {
    const from = total > 0 ? (page - 1) * limit + 1 : 0
    const to = Math.min(page * limit, total)

    return (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 w-full">
            {/* Showing X-Y of Z */}
            <p className="text-sm text-muted-foreground shrink-0 text-center sm:text-left">
                {total > 0 ? (
                    <>
                        Showing <span className="font-semibold text-foreground">{from}</span> to{' '}
                        <span className="font-semibold text-foreground">{to}</span> of{' '}
                        <span className="font-semibold text-foreground">{total}</span> {noun}
                    </>
                ) : (
                    <>No {noun} found</>
                )}
            </p>

            {/* Right side: page-size selector + pagination */}
            <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
                {/* Page Size Selector — hidden on small screens */}
                <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>Rows per page:</span>
                    <Select value={String(limit)} onValueChange={(val) => onLimitChange(Number(val))}>
                        <SelectTrigger size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {limitOptions.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pagination nav */}
                <PaginationComp page={page} limit={limit} total={total} onPageChange={onPageChange} />
            </div>
        </div>
    )
}

export { DataTable, DataTableFooter }
