import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatCardsGrid } from '@/components/shared/stat-card'
import type { StatCardProps } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import {
    CheckCircle2,
    Eye,
    EyeOff,
    HandHeart,
    HeartHandshake,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
    User as UserIcon,
    RotateCcw,
} from 'lucide-react'
import type {
    PrayerItem,
    AdminCreatePrayerInput,
    AdminUpdatePrayerInput,
} from '@/api/prayers'
import { resolveImage } from '@/api/base'

export interface PrayersUIProps {
    prayers: PrayerItem[]
    totalPrayers: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    activeTab: 'all' | 'active' | 'answered' | 'deleted'
    onTabChange: (tab: 'all' | 'active' | 'answered' | 'deleted') => void
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onCreatePrayer: (input: AdminCreatePrayerInput) => Promise<void>
    onUpdatePrayer: (id: string, input: AdminUpdatePrayerInput) => Promise<void>
    onDeletePrayer: (id: string, hard?: boolean) => Promise<void>
    onPrayForPrayer: (id: string) => Promise<void>
}

type FormState = {
    title: string
    content: string
    authorName: string
    isAnonymous: boolean
    isAnswered: boolean
    prayCount: number
}

const emptyForm: FormState = {
    title: '',
    content: '',
    authorName: '',
    isAnonymous: false,
    isAnswered: false,
    prayCount: 0,
}

export function PrayersUI({
    prayers,
    totalPrayers,
    loading = false,
    page,
    limit,
    searchQuery,
    activeTab,
    onTabChange,
    onSearchChange,
    onResetSearch,
    onCreatePrayer,
    onUpdatePrayer,
    onDeletePrayer,
    onPrayForPrayer,
}: PrayersUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<PrayerItem | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [viewing, setViewing] = useState<PrayerItem | null>(null)
    const [deleting, setDeleting] = useState<PrayerItem | null>(null)
    const [saving, setSaving] = useState(false)

    // Compute summary stats from current dataset
    const stats = useMemo(() => {
        const total = totalPrayers
        const answered = prayers.filter((p) => p.isAnswered).length
        const totalPrayCount = prayers.reduce((acc, p) => acc + (p.prayCount || 0), 0)
        const anonymous = prayers.filter((p) => p.isAnonymous).length
        return { total, answered, totalPrayCount, anonymous }
    }, [prayers, totalPrayers])

    const statCards = useMemo<StatCardProps[]>(
        () => [
            {
                label: 'Total Prayers',
                value: stats.total,
                icon: HeartHandshake,
                color: 'emerald',
            },
            {
                label: 'Answered (Testimonies)',
                value: stats.answered,
                icon: CheckCircle2,
                color: 'blue',
            },
            {
                label: 'Prayer Support Count',
                value: stats.totalPrayCount,
                icon: HandHeart,
                color: 'pink',
            },
            {
                label: 'Anonymous Requests',
                value: stats.anonymous,
                icon: EyeOff,
                color: 'slate',
            },
        ],
        [stats],
    )

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setFormOpen(true)
    }

    const openEdit = (prayer: PrayerItem) => {
        setEditing(prayer)
        setForm({
            title: prayer.title ?? '',
            content: prayer.content,
            authorName: prayer.authorName ?? prayer.user?.name ?? '',
            isAnonymous: prayer.isAnonymous,
            isAnswered: prayer.isAnswered,
            prayCount: prayer.prayCount,
        })
        setFormOpen(true)
    }

    const submitForm = async () => {
        if (!form.content.trim()) return
        setSaving(true)
        try {
            if (editing) {
                await onUpdatePrayer(editing.id, {
                    title: form.title || undefined,
                    content: form.content,
                    authorName: form.authorName || undefined,
                    isAnonymous: form.isAnonymous,
                    isAnswered: form.isAnswered,
                    prayCount: form.prayCount,
                })
            } else {
                await onCreatePrayer({
                    title: form.title || undefined,
                    content: form.content,
                    authorName: form.authorName || undefined,
                    isAnonymous: form.isAnonymous,
                    isAnswered: form.isAnswered,
                    prayCount: form.prayCount,
                })
            }
            setFormOpen(false)
        } finally {
            setSaving(false)
        }
    }

    const toggleAnswered = async (prayer: PrayerItem) => {
        await onUpdatePrayer(prayer.id, {
            isAnswered: !prayer.isAnswered,
        })
    }

    const restorePrayer = async (prayer: PrayerItem) => {
        await onUpdatePrayer(prayer.id, {
            isDeleted: false,
        })
    }

    const columns = useMemo<DataTableColumn<PrayerItem>[]>(
        () => [
            {
                key: 'author',
                header: 'AUTHOR',
                render: (row) => {
                    const avatar = row.user?.userProfile?.avatarUrl
                    const name = row.isAnonymous ? 'Anonymous' : (row.authorName || row.user?.name || 'Community Member')
                    return (
                        <div className="flex items-center gap-2.5 min-w-44">
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden text-muted-foreground border border-border/50">
                                {avatar && !row.isAnonymous ? (
                                    <img src={resolveImage(avatar)} alt={name} className="size-full object-cover" />
                                ) : (
                                    <UserIcon className="size-4 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-medium text-foreground text-sm truncate flex items-center gap-1.5">
                                    {name}
                                    {row.isAnonymous && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                                            Anon
                                        </Badge>
                                    )}
                                </span>
                                {row.user?.email && !row.isAnonymous && (
                                    <span className="text-xs text-muted-foreground truncate">{row.user.email}</span>
                                )}
                            </div>
                        </div>
                    )
                },
            },
            {
                key: 'prayer',
                header: 'PRAYER REQUEST',
                render: (row) => (
                    <div className="flex flex-col min-w-64 max-w-xl py-1">
                        {row.title && (
                            <span className="font-semibold text-foreground text-sm line-clamp-1 mb-0.5">
                                {row.title}
                            </span>
                        )}
                        <span className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                            {row.content}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => {
                    if (row.deletedAt) {
                        return (
                            <Badge variant="destructive" className="gap-1">
                                <Trash2 className="size-3" /> Deleted
                            </Badge>
                        )
                    }
                    if (row.isAnswered) {
                        return (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1 hover:bg-emerald-500/20">
                                <CheckCircle2 className="size-3" /> Answered
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1">
                            <Sparkles className="size-3" /> Needs Prayer
                        </Badge>
                    )
                },
            },
            {
                key: 'prayCount',
                header: 'PRAYED',
                render: (row) => (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <HandHeart className="size-3.5 text-pink-500 shrink-0" />
                        <span>{row.prayCount}</span>
                    </div>
                ),
            },
            {
                key: 'createdAt',
                header: 'DATE',
                render: (row) => (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: 'ACTIONS',
                render: (row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionButton label="View prayer" onClick={() => setViewing(row)}>
                            <Eye />
                        </ActionButton>
                        <ActionButton label="Edit prayer" onClick={() => openEdit(row)}>
                            <Pencil />
                        </ActionButton>
                        <ActionButton
                            label={row.isAnswered ? 'Mark unanswered' : 'Mark answered'}
                            onClick={() => toggleAnswered(row)}
                            className={row.isAnswered ? 'text-amber-600 hover:bg-amber-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'}
                        >
                            <CheckCircle2 />
                        </ActionButton>
                        <ActionButton
                            label="Pray (+1)"
                            onClick={() => onPrayForPrayer(row.id)}
                            className="text-pink-600 hover:bg-pink-500/10"
                        >
                            <HandHeart />
                        </ActionButton>
                        {row.deletedAt ? (
                            <ActionButton
                                label="Restore prayer"
                                onClick={() => restorePrayer(row)}
                                className="text-blue-600 hover:bg-blue-500/10"
                            >
                                <RotateCcw />
                            </ActionButton>
                        ) : (
                            <ActionButton
                                label="Delete prayer"
                                onClick={() => setDeleting(row)}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 />
                            </ActionButton>
                        )}
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [onPrayForPrayer],
    )

    return (
        <div className="space-y-6">
            <PageHeader
                title="Community Prayers"
                description="Manage user and community prayer requests, track answered prayers, and oversee the public prayer wall."
            >
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" /> Add Prayer
                </Button>
            </PageHeader>

            <StatCardsGrid cards={statCards} />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => onTabChange(val as any)}
                    className="w-full sm:w-auto"
                >
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="answered">Answered</TabsTrigger>
                        <TabsTrigger value="deleted">Archived</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <SearchInput
                        value={searchQuery}
                        onValueChange={onSearchChange}
                        placeholder="Search prayers or authors..."
                        className="w-full sm:w-72"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={prayers}
                    total={totalPrayers}
                    page={page}
                    limit={limit}
                    loading={loading}
                    noun="prayers"
                    onReset={onResetSearch}
                    emptyIcon={<HeartHandshake className="size-8 text-muted-foreground" />}
                />
            </div>

            {/* Create / Edit Form Dialog */}
            <PrayerFormDialog
                open={formOpen}
                editing={editing}
                form={form}
                saving={saving}
                onOpenChange={setFormOpen}
                onChange={setForm}
                onSubmit={submitForm}
            />

            {/* View Details Dialog */}
            <PrayerViewDialog
                prayer={viewing}
                onOpenChange={(open) => !open && setViewing(null)}
                onPray={onPrayForPrayer}
                onToggleAnswered={toggleAnswered}
            />

            {/* Delete Confirmation Dialog */}
            <TrashConfirm
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                name={deleting?.title || 'this prayer request'}
                onConfirm={async () => {
                    if (deleting) await onDeletePrayer(deleting.id)
                    setDeleting(null)
                }}
            />
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
            className={`rounded-full p-2 transition-colors cursor-pointer ${className}`}
        >
            <span className="size-4 [&>svg]:size-4 flex items-center justify-center">{children}</span>
        </button>
    )
}

function PrayerFormDialog({
    open,
    editing,
    form,
    saving,
    onOpenChange,
    onChange,
    onSubmit,
}: {
    open: boolean
    editing: PrayerItem | null
    form: FormState
    saving: boolean
    onOpenChange: (open: boolean) => void
    onChange: (form: FormState) => void
    onSubmit: () => Promise<void>
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Prayer Request' : 'Create Prayer Request'}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? 'Update prayer request details, response counts, or testimony status.'
                            : 'Add a new prayer request to the community prayer wall on behalf of a user or ministry.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Title / Subject (Optional)
                        </Label>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => onChange({ ...form, title: e.target.value })}
                            placeholder="e.g. Healing for my father"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="authorName" className="text-sm font-medium">
                            Author Display Name (Optional)
                        </Label>
                        <Input
                            id="authorName"
                            value={form.authorName}
                            onChange={(e) => onChange({ ...form, authorName: e.target.value })}
                            placeholder="e.g. Sarah J. or Leave blank"
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="content" className="text-sm font-medium">
                            Prayer Request Details <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            rows={4}
                            value={form.content}
                            onChange={(e) => onChange({ ...form, content: e.target.value })}
                            placeholder="Write the full prayer request..."
                            required
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="prayCount" className="text-sm font-medium">
                            Initial Prayer Count
                        </Label>
                        <Input
                            id="prayCount"
                            type="number"
                            min={0}
                            value={form.prayCount}
                            onChange={(e) => onChange({ ...form, prayCount: parseInt(e.target.value, 10) || 0 })}
                        />
                    </div>

                    <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                        <div className="space-y-0.5">
                            <Label htmlFor="isAnonymous" className="text-sm font-medium cursor-pointer">
                                Post Anonymously
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Hide author name and profile from public prayer walls.
                            </p>
                        </div>
                        <Switch
                            id="isAnonymous"
                            checked={form.isAnonymous}
                            onCheckedChange={(checked) => onChange({ ...form, isAnonymous: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                        <div className="space-y-0.5">
                            <Label htmlFor="isAnswered" className="text-sm font-medium cursor-pointer">
                                Mark as Answered (Testimony)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Marks this prayer as answered with a badge and testimony flag.
                            </p>
                        </div>
                        <Switch
                            id="isAnswered"
                            checked={form.isAnswered}
                            onCheckedChange={(checked) => onChange({ ...form, isAnswered: checked })}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button disabled={saving || !form.content.trim()} onClick={onSubmit}>
                        {editing ? 'Save Changes' : 'Create Prayer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PrayerViewDialog({
    prayer,
    onOpenChange,
    onPray,
    onToggleAnswered,
}: {
    prayer: PrayerItem | null
    onOpenChange: (open: boolean) => void
    onPray: (id: string) => Promise<void>
    onToggleAnswered: (prayer: PrayerItem) => Promise<void>
}) {
    if (!prayer) return null

    const authorName = prayer.isAnonymous ? 'Anonymous' : (prayer.authorName || prayer.user?.name || 'Community Member')

    return (
        <Dialog open={prayer !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-2 pr-6">
                        <DialogTitle className="text-lg font-semibold">Prayer Request Details</DialogTitle>
                        {prayer.isAnswered ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                                <CheckCircle2 className="size-3" /> Answered
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1">
                                <Sparkles className="size-3" /> Needs Prayer
                            </Badge>
                        )}
                    </div>
                    <DialogDescription>
                        Created on {new Date(prayer.createdAt).toLocaleDateString()} at{' '}
                        {new Date(prayer.createdAt).toLocaleTimeString()}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Author card */}
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                            {prayer.user?.userProfile?.avatarUrl && !prayer.isAnonymous ? (
                                <img
                                    src={resolveImage(prayer.user.userProfile.avatarUrl)}
                                    alt={authorName}
                                    className="size-full object-cover rounded-full"
                                />
                            ) : (
                                <UserIcon className="size-5" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                                {authorName}
                                {prayer.isAnonymous && (
                                    <Badge variant="secondary" className="text-[10px] h-4">
                                        Anonymous
                                    </Badge>
                                )}
                            </span>
                            {prayer.user?.email && !prayer.isAnonymous && (
                                <span className="text-xs text-muted-foreground">{prayer.user.email}</span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                        {prayer.title && <h3 className="font-semibold text-foreground text-base">{prayer.title}</h3>}
                        <p className="whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/20 p-4 text-foreground text-sm leading-relaxed">
                            {prayer.content}
                        </p>
                    </div>

                    {/* Stats & Metadata */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="border rounded-xl p-3 bg-card flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Prayed Count:</span>
                            <span className="text-sm font-bold text-foreground flex items-center gap-1">
                                <HandHeart className="size-3.5 text-pink-500" />
                                {prayer.prayCount}
                            </span>
                        </div>
                        <div className="border rounded-xl p-3 bg-card flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Status:</span>
                            <span className="text-xs font-semibold">
                                {prayer.deletedAt ? 'Archived' : prayer.isAnswered ? 'Answered' : 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onToggleAnswered(prayer)}
                        className="gap-1.5 text-emerald-600 hover:text-emerald-700"
                    >
                        <CheckCircle2 className="size-4" />
                        {prayer.isAnswered ? 'Mark Unanswered' : 'Mark Answered'}
                    </Button>
                    <Button onClick={() => onPray(prayer.id)} className="gap-1.5 bg-pink-600 hover:bg-pink-700 text-white">
                        <HandHeart className="size-4" /> Pray (+1)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
