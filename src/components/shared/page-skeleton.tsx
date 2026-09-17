import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
    return (
        <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Loading page">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <Skeleton className="hidden h-10 w-32 sm:block" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <TableSkeleton />
            </div>
        </div>
    )
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex gap-4 bg-primary/10 p-4">
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={`header-${index}`} className="h-3 flex-1 bg-primary/20" />
                ))}
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, row) => (
                    <div key={row} className="flex items-center gap-4 p-4">
                        {Array.from({ length: columns }).map((_, column) => (
                            <Skeleton key={`${row}-${column}`} className={`h-4 ${column === 0 ? 'w-1/4' : 'flex-1'}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
