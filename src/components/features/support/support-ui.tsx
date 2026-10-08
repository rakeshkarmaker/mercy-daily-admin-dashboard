import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatCardsGrid } from '@/components/shared/stat-card'
import { Inbox, MailOpen, Eye } from 'lucide-react'
import type { ContactMessage, ContactMessageStatus } from '@/api/contact'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { id: ContactMessageStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'NEW', label: 'New' },
    { id: 'READ', label: 'Read' },
    { id: 'RESOLVED', label: 'Resolved' },
]

const STATUS_STYLES: Record<ContactMessageStatus, string> = {
    NEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    READ: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20',
    RESOLVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

type SupportUIProps = {
    messages: ContactMessage[]
    total: number
    unread: number
    loading: boolean
    page: number
    limit: number
    statusFilter: ContactMessageStatus | 'ALL'
    onStatusFilterChange: (status: ContactMessageStatus | 'ALL') => void
    onStatusChange: (id: string, status: ContactMessageStatus) => void
    statusPending: boolean
    onReset: () => void
}

export function SupportUI({
    messages,
    total,
    unread,
    loading,
    page,
    limit,
    statusFilter,
    onStatusFilterChange,
    onStatusChange,
    statusPending,
    onReset,
}: SupportUIProps) {
    const [selected, setSelected] = useState<ContactMessage | null>(null)

    const columns: DataTableColumn<ContactMessage>[] = [
        {
            key: 'sender',
            header: 'Sender',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span className="text-xs text-muted-foreground">{row.email}</span>
                </div>
            ),
        },
        {
            key: 'subject',
            header: 'Subject',
            render: (row) => <span className="text-foreground">{row.subject}</span>,
        },
        {
            key: 'received',
            header: 'Received',
            render: (row) => <span className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(row.createdAt)}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <Badge variant="outline" className={cn('rounded-full font-semibold', STATUS_STYLES[row.status])}>
                    {row.status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                    <Eye className="size-4 mr-1.5" />
                    View
                </Button>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-5">
            <PageHeader title="Support Inbox" description="Messages submitted from the website contact and help & support forms." />

            <StatCardsGrid
                cards={[
                    { label: 'Unread messages', value: unread, icon: MailOpen, color: 'orange' },
                    { label: 'Total messages', value: total, icon: Inbox, color: 'blue' },
                ]}
            />

            <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((f) => (
                    <Button
                        key={f.id}
                        variant={statusFilter === f.id ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => onStatusFilterChange(f.id)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            <DataTable
                loading={loading}
                columns={columns}
                data={messages}
                noun="messages"
                page={page}
                limit={limit}
                total={total}
                onReset={onReset}
                emptyIcon={<Inbox className="h-6 w-6" />}
            />

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                    {selected && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <DialogTitle className="text-lg font-semibold">{selected.subject}</DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selected.name} · {selected.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(selected.createdAt)}</p>
                                </div>
                                <Badge variant="outline" className={cn('rounded-full font-semibold shrink-0', STATUS_STYLES[selected.status])}>
                                    {selected.status}
                                </Badge>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-xl bg-muted/50 p-4">
                                {selected.message}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selected.status === 'NEW' && (
                                    <Button
                                        size="sm"
                                        disabled={statusPending}
                                        onClick={() => {
                                            onStatusChange(selected.id, 'READ')
                                            setSelected(null)
                                        }}
                                    >
                                        Mark as read
                                    </Button>
                                )}
                                {selected.status !== 'RESOLVED' && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={statusPending}
                                        onClick={() => {
                                            onStatusChange(selected.id, 'RESOLVED')
                                            setSelected(null)
                                        }}
                                    >
                                        Resolve
                                    </Button>
                                )}
                                {selected.status === 'RESOLVED' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={statusPending}
                                        onClick={() => {
                                            onStatusChange(selected.id, 'READ')
                                            setSelected(null)
                                        }}
                                    >
                                        Reopen
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" asChild>
                                    <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}>
                                        Reply by email
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
