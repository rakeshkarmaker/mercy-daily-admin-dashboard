import { cn } from '@/lib/utils'

export function PageHeader({
    title,
    description,
    className,
    children,
}: {
    title: string
    description?: string
    className?: string
    children?: React.ReactNode
}) {
    if (children) {
        return (
            <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <div className="flex items-center gap-2">{children}</div>
            </div>
        )
    }

    return (
        <div className={cn('flex flex-col gap-0.5', className)}>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    )
}
