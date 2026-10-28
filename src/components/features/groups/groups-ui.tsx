import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatCardsGrid } from '@/components/shared/stat-card'
import { StatusConfirm } from '@/components/shared/status-confirm'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resolveImage } from '@/api/base'
import type { AdminGroupSummary, GroupStatus, GroupVisibility } from '@/api/groups'
import { Eye, MessagesSquare, PauseCircle, PlayCircle, ShieldCheck, Trash2, Users, UsersRound } from 'lucide-react'

const STATUS_STYLES: Record<GroupStatus, string> = {
    ACTIVE: 'bg-success/10 text-success',
    SUSPENDED: 'bg-warning/10 text-warning',
    DELETED: 'bg-muted text-muted-foreground',
}

const VISIBILITY_LABELS: Record<GroupVisibility, string> = {
    PUBLIC: 'Public',
    INVITE_ONLY: 'Invite only',
}

const STATUS_FILTERS: { value: 'ALL' | GroupStatus; label: string }[] = [
    { value: 'ALL', label: 'All statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'DELETED', label: 'Deleted' },
]

function timeAgo(iso: string | null): string {
    if (!iso) return 'No messages yet'
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

export interface GroupsUIProps {
    groups: AdminGroupSummary[]
    total: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    status: 'ALL' | GroupStatus
    onSearchChange: (value: string) => void
    onStatusChange: (value: 'ALL' | GroupStatus) => void
    onReset: () => void
    onSuspend: (group: AdminGroupSummary) => Promise<void>
    onReactivate: (group: AdminGroupSummary) => Promise<void>
    onDelete: (group: AdminGroupSummary) => Promise<void>
}

export function GroupsUI({
    groups,
    total,
    loading = false,
    page,
    limit,
    searchQuery,
    status,
    onSearchChange,
    onStatusChange,
    onReset,
    onSuspend,
    onReactivate,
    onDelete,
}: GroupsUIProps) {
    const [statusTarget, setStatusTarget] = useState<AdminGroupSummary | null>(null)
    const [deleting, setDeleting] = useState<AdminGroupSummary | null>(null)
    const [busy, setBusy] = useState(false)

    const stats = useMemo(() => {
        const active = groups.filter((g) => g.status === 'ACTIVE').length
        const suspended = groups.filter((g) => g.status === 'SUSPENDED').length
        const messages = groups.reduce((sum, g) => sum + g.messagesCount, 0)
        return { active, suspended, messages }
    }, [groups])

    const columns: DataTableColumn<AdminGroupSummary>[] = useMemo(
        () => [
            {
                key: 'group',
                header: 'GROUP',
                render: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                            {row.avatarUrl ? (
                                <img src={resolveImage(row.avatarUrl)} alt={row.name} className="size-full object-cover" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
                                    {row.name.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-foreground">{row.name}</span>
                            <span className="truncate font-mono text-[11px] text-muted-foreground">{row.id.slice(0, 8)}…</span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}
                        title={row.suspendedReason ?? undefined}
                    >
                        {row.status.toLowerCase()}
                    </span>
                ),
            },
            {
                key: 'visibility',
                header: 'ACCESS',
                render: (row) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            row.visibility === 'PUBLIC'
                                ? 'bg-info/10 text-info'
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {VISIBILITY_LABELS[row.visibility]}
                    </span>
                ),
            },
            {
                key: 'memberCount',
                header: 'MEMBERS',
                render: (row) => (
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                        <Users className="size-3.5" /> {row.memberCount}
                    </span>
                ),
            },
            {
                key: 'messagesCount',
                header: 'MESSAGES',
                render: (row) => (
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                        <MessagesSquare className="size-3.5" /> {row.messagesCount}
                    </span>
                ),
            },
            {
                key: 'owner',
                header: 'OWNER',
                render: (row) => (
                    <span className="whitespace-nowrap text-muted-foreground">{row.createdBy?.name ?? 'Unknown'}</span>
                ),
            },
            {
                key: 'lastMessageAt',
                header: 'LAST ACTIVITY',
                render: (row) => (
                    <span className="whitespace-nowrap text-muted-foreground">{timeAgo(row.lastMessageAt)}</span>
                ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                        <Link
                            to="/groups/$groupId"
                            params={{ groupId: row.id }}
                            className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
                            aria-label="View group"
                            title="View group"
                        >
                            <Eye className="size-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setStatusTarget(row)}
                            className="rounded-full p-2 text-warning transition-colors hover:bg-warning/10"
                            aria-label={row.status === 'ACTIVE' ? 'Suspend group' : 'Reactivate group'}
                            title={row.status === 'ACTIVE' ? 'Suspend group' : 'Reactivate group'}
                        >
                            {row.status === 'ACTIVE' ? <PauseCircle className="size-4" /> : <PlayCircle className="size-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeleting(row)}
                            className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10"
                            aria-label="Delete group"
                            title="Delete group"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    )

    return (
        <>
            <div className="relative flex w-full max-w-full flex-col">
                <div className="flex flex-col justify-between gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center">
                    <PageHeader title="Group Chats" description="Monitor group conversations, membership and moderation actions." />
                    <div className="flex flex-wrap items-center gap-3">
                        <SearchInput
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            placeholder="Search groups..."
                            className="h-10 w-full rounded-full border-border bg-card shadow-sm sm:w-62.5"
                        />
                        <Select value={status} onValueChange={(value) => onStatusChange(value as 'ALL' | GroupStatus)}>
                            <SelectTrigger className="h-10 w-full rounded-full bg-card px-4 sm:w-44" aria-label="Filter by status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_FILTERS.map((filter) => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="py-4">
                    <StatCardsGrid
                        cards={[
                            { label: 'Groups (all pages)', value: total, icon: UsersRound, color: 'emerald' },
                            { label: 'Active on this page', value: stats.active, icon: ShieldCheck, color: 'blue' },
                            { label: 'Suspended on this page', value: stats.suspended, icon: PauseCircle, color: 'orange' },
                            { label: 'Messages on this page', value: stats.messages, icon: MessagesSquare, color: 'amber' },
                        ]}
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={groups}
                    loading={loading}
                    total={total}
                    page={page}
                    limit={limit}
                    noun="groups"
                    emptyIcon={<MessagesSquare className="h-6 w-6" />}
                    onReset={onReset}
                />
            </div>

            <StatusConfirm
                open={statusTarget !== null}
                onOpenChange={(open) => !open && setStatusTarget(null)}
                name={statusTarget?.name ?? 'this group'}
                currentStatus={statusTarget?.status.toLowerCase() ?? ''}
                newStatus={statusTarget?.status === 'ACTIVE' ? 'suspended' : 'active'}
                title={statusTarget?.status === 'ACTIVE' ? 'Suspend group?' : 'Reactivate group?'}
                onConfirm={async () => {
                    if (!statusTarget || busy) return
                    setBusy(true)
                    try {
                        if (statusTarget.status === 'ACTIVE') {
                            await onSuspend(statusTarget)
                        } else {
                            await onReactivate(statusTarget)
                        }
                    } finally {
                        setBusy(false)
                        setStatusTarget(null)
                    }
                }}
            />

            <TrashConfirm
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete group?"
                description="This hides the group from members and cannot be joined:"
                name={deleting?.name ?? 'this group'}
                reversibilityNote="Messages stay available to moderators (soft delete)."
                onConfirm={async () => {
                    if (!deleting || busy) return
                    setBusy(true)
                    try {
                        await onDelete(deleting)
                    } finally {
                        setBusy(false)
                        setDeleting(null)
                    }
                }}
            />
        </>
    )
}
