import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { StatusConfirm } from '@/components/shared/status-confirm'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { resolveImage } from '@/api/base'
import { inviteUrl } from '@/api/groups'
import type { AdminGroupDetail, GroupMember, GroupMemberRole, GroupMessage, GroupStatus, GroupVisibility } from '@/api/groups'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Copy,
    MessagesSquare,
    PauseCircle,
    PlayCircle,
    ShieldCheck,
    Trash2,
    UserMinus,
    Users,
} from 'lucide-react'

const STATUS_STYLES: Record<GroupStatus, string> = {
    ACTIVE: 'bg-success/10 text-success',
    SUSPENDED: 'bg-warning/10 text-warning',
    DELETED: 'bg-muted text-muted-foreground',
}

const VISIBILITY_LABELS: Record<GroupVisibility, string> = {
    PUBLIC: 'Public',
    INVITE_ONLY: 'Invite only',
}

const ROLE_STYLES: Record<GroupMemberRole, string> = {
    OWNER: 'bg-primary/10 text-primary',
    ADMIN: 'bg-info/10 text-info',
    MEMBER: 'bg-muted text-muted-foreground',
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function initials(name: string | undefined): string {
    return (name ?? '?').slice(0, 2).toUpperCase()
}

export type GroupDetailTab = 'members' | 'messages'

export interface GroupDetailUIProps {
    group: AdminGroupDetail | null
    loading?: boolean
    error?: string | null
    tab: GroupDetailTab
    onTabChange: (tab: GroupDetailTab) => void
    messages: GroupMessage[]
    messagesTotal: number
    messagesLoading?: boolean
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onSuspend: () => Promise<void>
    onReactivate: () => Promise<void>
    onDeleteGroup: () => Promise<void>
    onRemoveMember: (member: GroupMember) => Promise<void>
    onDeleteMessage: (message: GroupMessage) => Promise<void>
}

export function GroupDetailUI({
    group,
    loading = false,
    error = null,
    tab,
    onTabChange,
    messages,
    messagesTotal,
    messagesLoading = false,
    page,
    limit,
    searchQuery,
    onSearchChange,
    onResetSearch,
    onSuspend,
    onReactivate,
    onDeleteGroup,
    onRemoveMember,
    onDeleteMessage,
}: GroupDetailUIProps) {
    const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
    const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null)
    const [messageToDelete, setMessageToDelete] = useState<GroupMessage | null>(null)
    const [busy, setBusy] = useState(false)

    const messageColumns: DataTableColumn<GroupMessage>[] = useMemo(
        () => [
            {
                key: 'sender',
                header: 'SENDER',
                render: (row) => (
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                            {row.sender?.avatarUrl ? (
                                <img
                                    src={resolveImage(row.sender.avatarUrl)}
                                    alt={row.sender.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                    {initials(row.sender?.name)}
                                </div>
                            )}
                        </div>
                        <span className="whitespace-nowrap text-sm font-medium text-foreground">
                            {row.sender?.name ?? 'Deleted user'}
                        </span>
                    </div>
                ),
            },
            {
                key: 'content',
                header: 'MESSAGE',
                render: (row) => (
                    <div className="flex max-w-100 items-center gap-2">
                        <span
                            className={`truncate text-sm ${row.deletedAt ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                        >
                            {row.content}
                        </span>
                        {row.deletedAt && (
                            <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                                deleted
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                key: 'createdAt',
                header: 'SENT',
                render: (row) => (
                    <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.createdAt)}</span>
                ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => setMessageToDelete(row)}
                            disabled={row.deletedAt !== null}
                            className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete message"
                            title={row.deletedAt ? 'Already deleted' : 'Delete message'}
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    )

    const copyInvite = async () => {
        if (!group?.inviteCode) return
        try {
            await navigator.clipboard.writeText(inviteUrl(group.inviteCode))
            toast.success('Invite link copied')
        } catch {
            toast.error('Could not copy the invite link')
        }
    }

    if (loading) {
        return (
            <div className="flex w-full flex-col gap-4" aria-busy="true">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-32 w-full animate-pulse rounded-xl bg-muted/70" />
                <div className="h-64 w-full animate-pulse rounded-xl bg-muted/50" />
                <span className="sr-only">Loading group…</span>
            </div>
        )
    }

    if (error || !group) {
        return (
            <div className="flex flex-col items-start gap-4 py-10">
                <Link to="/groups" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <ArrowLeft className="size-4" /> Back to groups
                </Link>
                <p className="text-sm text-muted-foreground">{error ?? 'Group not found.'}</p>
            </div>
        )
    }

    return (
        <>
            <div className="flex w-full flex-col gap-4">
                <Link to="/groups" className="flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
                    <ArrowLeft className="size-4" /> Back to groups
                </Link>

                {/* Header card */}
                <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                            {group.avatarUrl ? (
                                <img src={resolveImage(group.avatarUrl)} alt={group.name} className="size-full object-cover" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-base font-semibold text-muted-foreground">
                                    {initials(group.name)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold tracking-tight text-foreground">{group.name}</h2>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[group.status]}`}
                                >
                                    {group.status.toLowerCase()}
                                </span>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                        group.visibility === 'PUBLIC'
                                            ? 'bg-info/10 text-info'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                    title={
                                        group.visibility === 'PUBLIC'
                                            ? 'Anyone can find and join this group'
                                            : 'Members can only join through an invite link'
                                    }
                                >
                                    {VISIBILITY_LABELS[group.visibility]}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {group.description || 'No description'}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Users className="size-3.5" /> {group.memberCount} members
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessagesSquare className="size-3.5" /> {group.messagesCount} messages
                                </span>
                                <span>Owner: {group.createdBy?.name ?? 'Unknown'}</span>
                                <span>Created {formatDate(group.createdAt)}</span>
                            </div>
                            {group.suspendedReason && (
                                <p className="text-xs text-warning">Suspended: {group.suspendedReason}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {group.inviteCode ? (
                            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 py-1 pl-3 pr-1">
                                <span className="font-mono text-xs text-muted-foreground">{group.inviteCode}</span>
                                <Button variant="ghost" size="icon-xs" onClick={copyInvite} aria-label="Copy invite link" title="Copy invite link">
                                    <Copy className="size-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">No active invite</span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setStatusConfirmOpen(true)}>
                            {group.status === 'ACTIVE' ? (
                                <>
                                    <PauseCircle className="mr-1.5 size-3.5" /> Suspend
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="mr-1.5 size-3.5" /> Reactivate
                                </>
                            )}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteGroupOpen(true)}>
                            <Trash2 className="mr-1.5 size-3.5" /> Delete group
                        </Button>
                    </div>
                </div>

                <Tabs value={tab} onValueChange={(value) => onTabChange(value as GroupDetailTab)} className="w-full">
                    <TabsList variant="line" className="w-full justify-start border-b border-border/50">
                        <TabsTrigger value="members" className="flex-none px-4">
                            Members ({group.memberCount})
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="flex-none px-4">
                            Messages ({group.messagesCount})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {tab === 'members' ? (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            Removing a member only ends their access — the owner cannot be removed here.
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <Table>
                                <TableHeader className="bg-primary [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-primary-foreground">
                                    <TableRow className="border-0 hover:bg-transparent">
                                        <TableHead>MEMBER</TableHead>
                                        <TableHead>USER ID</TableHead>
                                        <TableHead>ROLE</TableHead>
                                        <TableHead>JOINED</TableHead>
                                        <TableHead className="text-center">ACTION</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.members.map((member) => (
                                        <TableRow key={member.userId}>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                                                        {member.avatarUrl ? (
                                                            <img
                                                                src={resolveImage(member.avatarUrl)}
                                                                alt={member.name}
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                                                {initials(member.name)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="whitespace-nowrap text-sm font-medium text-foreground">
                                                        {member.name}
                                                        {member.isMe && (
                                                            <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    {member.userId.slice(0, 8)}…
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_STYLES[member.role]}`}
                                                >
                                                    {member.role.toLowerCase()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="whitespace-nowrap text-muted-foreground">
                                                    {formatDate(member.joinedAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMemberToRemove(member)}
                                                        disabled={member.role === 'OWNER'}
                                                        className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                        aria-label={`Remove ${member.name}`}
                                                        title={
                                                            member.role === 'OWNER'
                                                                ? 'The owner cannot be removed'
                                                                : `Remove ${member.name}`
                                                        }
                                                    >
                                                        <UserMinus className="size-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <ShieldCheck className="size-4" /> Every message, including deleted ones, newest first.
                            </p>
                            <SearchInput
                                value={searchQuery}
                                onValueChange={onSearchChange}
                                placeholder="Search messages..."
                                className="h-10 w-full rounded-full border-border bg-card shadow-sm sm:w-62.5"
                            />
                        </div>
                        <DataTable
                            columns={messageColumns}
                            data={messages}
                            loading={messagesLoading}
                            total={messagesTotal}
                            page={page}
                            limit={limit}
                            noun="messages"
                            emptyIcon={<MessagesSquare className="h-6 w-6" />}
                            onReset={onResetSearch}
                        />
                    </div>
                )}
            </div>

            <StatusConfirm
                open={statusConfirmOpen}
                onOpenChange={setStatusConfirmOpen}
                name={group.name}
                currentStatus={group.status.toLowerCase()}
                newStatus={group.status === 'ACTIVE' ? 'suspended' : 'active'}
                title={group.status === 'ACTIVE' ? 'Suspend group?' : 'Reactivate group?'}
                onConfirm={async () => {
                    if (busy) return
                    setBusy(true)
                    try {
                        if (group.status === 'ACTIVE') {
                            await onSuspend()
                        } else {
                            await onReactivate()
                        }
                        setStatusConfirmOpen(false)
                    } finally {
                        setBusy(false)
                    }
                }}
            />

            <TrashConfirm
                open={deleteGroupOpen}
                onOpenChange={setDeleteGroupOpen}
                title="Delete group?"
                description="This hides the group from members and cannot be joined:"
                name={group.name}
                reversibilityNote="Messages stay available to moderators (soft delete)."
                onConfirm={async () => {
                    if (busy) return
                    setBusy(true)
                    try {
                        await onDeleteGroup()
                    } finally {
                        setBusy(false)
                        setDeleteGroupOpen(false)
                    }
                }}
            />

            <TrashConfirm
                open={memberToRemove !== null}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Remove member?"
                description="This removes them from the group:"
                name={memberToRemove?.name ?? 'this member'}
                reversibilityNote="They can rejoin later through a valid invite link."
                onConfirm={async () => {
                    if (!memberToRemove || busy) return
                    setBusy(true)
                    try {
                        await onRemoveMember(memberToRemove)
                    } finally {
                        setBusy(false)
                        setMemberToRemove(null)
                    }
                }}
            />

            <TrashConfirm
                open={messageToDelete !== null}
                onOpenChange={(open) => !open && setMessageToDelete(null)}
                title="Delete message?"
                description="This hides the message from members:"
                name={messageToDelete ? `"${messageToDelete.content.slice(0, 40)}"` : 'this message'}
                reversibilityNote="It stays visible in this moderation log."
                onConfirm={async () => {
                    if (!messageToDelete || busy) return
                    setBusy(true)
                    try {
                        await onDeleteMessage(messageToDelete)
                    } finally {
                        setBusy(false)
                        setMessageToDelete(null)
                    }
                }}
            />

        </>
    )
}
