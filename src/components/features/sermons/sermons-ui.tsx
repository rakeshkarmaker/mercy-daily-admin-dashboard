import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Pencil, Plus, ThumbsUp, Trash2, Youtube } from 'lucide-react'
import { resolveImage } from '@/api/base'
import type { Sermon, SermonInput, SermonStatus } from '@/api/sermons'

type StatusFilter = SermonStatus | 'ALL'

export interface SermonsUIProps {
    sermons: Sermon[]
    totalSermons: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    status: StatusFilter
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onStatusChange: (value: StatusFilter) => void
    onCreateSermon: (input: SermonInput) => Promise<void>
    onUpdateSermon: (id: string, input: Partial<SermonInput>) => Promise<void>
    onDeleteSermon: (id: string) => Promise<void>
}

type FormState = {
    title: string
    overview: string
    thumbnailUrl: string
    youtubeUrl: string
    durationSec: string
    status: SermonStatus
}

const emptyForm: FormState = {
    title: '',
    overview: '',
    thumbnailUrl: '',
    youtubeUrl: '',
    durationSec: '',
    status: 'PUBLISHED',
}

const STATUS_BADGE: Record<SermonStatus, string> = {
    PUBLISHED: 'bg-success/10 text-success',
    DRAFT: 'bg-primary/10 text-primary',
    ARCHIVED: 'bg-muted text-muted-foreground',
}

function formatDuration(durationSec: number | null): string {
    if (durationSec === null) return '—'
    const minutes = Math.floor(durationSec / 60)
    const seconds = String(durationSec % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
}

export function SermonsUI({
    sermons,
    totalSermons,
    loading = false,
    page,
    limit,
    searchQuery,
    status,
    onSearchChange,
    onResetSearch,
    onStatusChange,
    onCreateSermon,
    onUpdateSermon,
    onDeleteSermon,
}: SermonsUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Sermon | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [viewing, setViewing] = useState<Sermon | null>(null)
    const [deleting, setDeleting] = useState<Sermon | null>(null)
    const [saving, setSaving] = useState(false)

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setFormOpen(true)
    }

    const openEdit = (sermon: Sermon) => {
        setEditing(sermon)
        setForm({
            title: sermon.title,
            overview: sermon.overview ?? '',
            thumbnailUrl: sermon.thumbnailUrl ?? '',
            youtubeUrl: sermon.youtubeUrl ?? '',
            durationSec: sermon.durationSec !== null ? String(sermon.durationSec) : '',
            status: sermon.status,
        })
        setFormOpen(true)
    }

    const submitForm = async () => {
        if (!form.title.trim() || !form.youtubeUrl.trim()) return
        setSaving(true)
        try {
            const input: SermonInput = {
                title: form.title.trim(),
                overview: form.overview.trim() || undefined,
                thumbnailUrl: form.thumbnailUrl.trim() || undefined,
                youtubeUrl: form.youtubeUrl.trim(),
                durationSec: form.durationSec ? Number(form.durationSec) : undefined,
                status: form.status,
            }
            if (editing) await onUpdateSermon(editing.id, input)
            else await onCreateSermon(input)
            setFormOpen(false)
        } finally {
            setSaving(false)
        }
    }

    const columns = useMemo<DataTableColumn<Sermon>[]>(
        () => [
            {
                key: 'thumbnail',
                header: '',
                render: (row) =>
                    row.thumbnailUrl ? (
                        <img
                            src={resolveImage(row.thumbnailUrl)}
                            alt=""
                            className="h-10 w-16 rounded-md border border-border/50 object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border border-border/50 bg-muted/40 text-muted-foreground">
                            <Youtube className="size-4" />
                        </div>
                    ),
            },
            {
                key: 'title',
                header: 'TITLE',
                render: (row) => <span className="line-clamp-2 max-w-80 font-semibold text-foreground">{row.title}</span>,
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                        {row.status}
                    </span>
                ),
            },
            {
                key: 'topics',
                header: 'TOPICS',
                render: (row) => (
                    <span className="line-clamp-1 max-w-40 text-muted-foreground">
                        {row.topics.map((t) => `#${t.slug}`).join(' ') || '—'}
                    </span>
                ),
            },
            {
                key: 'duration',
                header: 'LENGTH',
                render: (row) => <span className="text-muted-foreground">{formatDuration(row.durationSec)}</span>,
            },
            {
                key: 'views',
                header: 'VIEWS',
                render: (row) => <span className="text-muted-foreground">{row.viewsCount.toLocaleString()}</span>,
            },
            {
                key: 'likes',
                header: 'LIKES',
                render: (row) => (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="size-3" />
                        {row.likesCount.toLocaleString()}
                    </span>
                ),
            },
            {
                key: 'publishedAt',
                header: 'PUBLISHED',
                render: (row) => (
                    <span className="text-muted-foreground">{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—'}</span>
                ),
            },
            {
                key: 'actions',
                header: 'ACTIONS',
                render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                        <ActionButton label="View" onClick={() => setViewing(row)}>
                            <Eye />
                        </ActionButton>
                        <ActionButton label="Edit" onClick={() => openEdit(row)}>
                            <Pencil />
                        </ActionButton>
                        <ActionButton label="Delete" onClick={() => setDeleting(row)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 />
                        </ActionButton>
                    </div>
                ),
            },
        ],
        // openEdit closes over component state setters that are stable for
        // this presenter's lifetime; the eslint disable keeps useMemo honest.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <div className="flex w-full max-w-full flex-col gap-4">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader title="Sermons" description="Publish video sermons, manage drafts and review engagement." />
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={searchQuery}
                        onValueChange={onSearchChange}
                        placeholder="Search sermons..."
                        className="w-full sm:w-64"
                    />
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 size-4" />
                        Add sermon
                    </Button>
                </div>
            </div>

            <Tabs value={status} onValueChange={(value) => onStatusChange(value as StatusFilter)} className="w-full">
                <TabsList variant="line" className="mb-3 w-full justify-start border-b border-border/50">
                    <TabsTrigger value="ALL" className="flex-none px-4">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="PUBLISHED" className="flex-none px-4">
                        Published
                    </TabsTrigger>
                    <TabsTrigger value="DRAFT" className="flex-none px-4">
                        Drafts
                    </TabsTrigger>
                    <TabsTrigger value="ARCHIVED" className="flex-none px-4">
                        Archived
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <DataTable
                columns={columns}
                data={sermons}
                loading={loading}
                total={totalSermons}
                page={page}
                limit={limit}
                noun="sermons"
                emptyIcon={<Youtube className="size-6" />}
                onReset={onResetSearch}
            />

            <SermonFormDialog
                open={formOpen}
                editing={editing}
                form={form}
                saving={saving}
                onOpenChange={setFormOpen}
                onChange={setForm}
                onSubmit={submitForm}
            />

            <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    {viewing && (
                        <>
                            <DialogHeader className="border-b border-dialog-border pb-4">
                                <div className="flex items-start gap-3 pr-6">
                                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                        <Youtube className="size-5" />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <DialogTitle className="text-xl">{viewing.title}</DialogTitle>
                                        <DialogDescription>
                                            {viewing.status} ·{' '}
                                            {viewing.publishedAt
                                                ? `Published ${new Date(viewing.publishedAt).toLocaleDateString()}`
                                                : `Created ${new Date(viewing.createdAt).toLocaleDateString()}`}
                                            {` · ${viewing.viewsCount.toLocaleString()} views`}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-5 py-1">
                                {viewing.thumbnailUrl && (
                                    <img
                                        src={resolveImage(viewing.thumbnailUrl)}
                                        alt={viewing.title}
                                        className="aspect-video w-full rounded-xl border border-border/50 object-cover"
                                    />
                                )}
                                <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                                    <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                                        {viewing.overview ?? 'No overview yet.'}
                                    </p>
                                </section>
                                <div className="flex flex-wrap gap-2">
                                    {viewing.topics.map((topic) => (
                                        <Badge key={topic.id} variant="secondary">
                                            #{topic.slug}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <Metric label="Views" value={viewing.viewsCount} />
                                    <Metric label="Likes" value={viewing.likesCount} />
                                    <Metric label="Comments" value={viewing.commentsCount} />
                                    <Metric label="Shares" value={viewing.sharesCount} />
                                </div>
                            </div>
                            <DialogFooter className="border-dialog-border">
                                <Button variant="outline" onClick={() => setViewing(null)}>
                                    Close
                                </Button>
                                {viewing.youtubeUrl && (
                                    <Button variant="outline" asChild>
                                        <a href={viewing.youtubeUrl} target="_blank" rel="noreferrer">
                                            <Youtube className="mr-2 size-4" />
                                            Open on YouTube
                                        </a>
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        openEdit(viewing)
                                        setViewing(null)
                                    }}
                                >
                                    <Pencil className="mr-2 size-4" />
                                    Edit sermon
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <TrashConfirm
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                name={deleting?.title ?? 'this sermon'}
                onConfirm={async () => {
                    if (deleting) await onDeleteSermon(deleting.id)
                    setDeleting(null)
                }}
            />
        </div>
    )
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-dialog-border bg-dialog-bg/60 p-3">
            <p className="text-lg font-semibold text-foreground">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    )
}

function ActionButton({
    label,
    onClick,
    children,
    className = 'text-primary hover:bg-primary/10',
}: {
    label: string
    onClick: () => void
    children: React.ReactNode
    className?: string
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className={`rounded-full p-2 transition-colors ${className}`}
        >
            {children && <span className="size-4 [&>svg]:size-4">{children}</span>}
        </button>
    )
}

function SermonFormDialog({
    open,
    editing,
    form,
    saving,
    onOpenChange,
    onChange,
    onSubmit,
}: {
    open: boolean
    editing: Sermon | null
    form: FormState
    saving: boolean
    onOpenChange: (open: boolean) => void
    onChange: (form: FormState) => void
    onSubmit: () => Promise<void>
}) {
    const set = (key: keyof FormState, value: string) => onChange({ ...form, [key]: value })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit sermon' : 'Add sermon'}</DialogTitle>
                    <DialogDescription>
                        Title and YouTube link are required. PUBLISHED sermons appear in the app feed immediately; DRAFT stays hidden until
                        published.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Title
                        <Input
                            value={form.title}
                            onChange={(event) => set('title', event.target.value)}
                            placeholder="The Power of Stillness"
                            aria-label="Title"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Overview
                        <Textarea
                            value={form.overview}
                            onChange={(event) => set('overview', event.target.value)}
                            placeholder="What is this sermon about?"
                            aria-label="Overview"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Thumbnail URL
                        <Input
                            value={form.thumbnailUrl}
                            onChange={(event) => set('thumbnailUrl', event.target.value)}
                            placeholder="https://img.youtube.com/vi/xxx/hq.jpg"
                            aria-label="Thumbnail URL"
                        />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        YouTube link
                        <Input
                            value={form.youtubeUrl}
                            onChange={(event) => set('youtubeUrl', event.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            aria-label="YouTube link"
                        />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1.5 text-sm font-medium">
                            Duration (seconds)
                            <Input
                                type="number"
                                min={0}
                                value={form.durationSec}
                                onChange={(event) => set('durationSec', event.target.value)}
                                placeholder="1725 (28:45)"
                                aria-label="Duration in seconds"
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium">
                            Status
                            <Select value={form.status} onValueChange={(value) => set('status', value)}>
                                <SelectTrigger aria-label="Status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PUBLISHED">Published</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button disabled={saving || !form.title.trim() || !form.youtubeUrl.trim()} onClick={onSubmit}>
                        {editing ? 'Save changes' : 'Create sermon'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
