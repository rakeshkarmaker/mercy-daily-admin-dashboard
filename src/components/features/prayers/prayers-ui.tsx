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
    HandHeart,
    HeartHandshake,
    Pencil,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    Quote,
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

function ActionButton({
    label,
    onClick,
    children,
    className,
}: {
    label: string
    onClick: () => void
    children: React.ReactNode
    className?: string
}) {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            title={label}
            className={`size-8 text-muted-foreground transition-colors cursor-pointer ${className ?? ''}`}
        >
            <span className="sr-only">{label}</span>
            {children}
        </Button>
    )
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

    // Calculate quick stats from prayers
    const stats = useMemo(() => {
        const answered = prayers.filter((p) => p.isAnswered).length
        const needsPrayer = prayers.filter((p) => !p.isAnswered && !p.deletedAt).length
        const totalPrayCount = prayers.reduce((acc, p) => acc + (p.prayCount || 0), 0)
        return {
            total: totalPrayers,
            needsPrayer,
            answered,
            totalPrayCount,
        }
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
                label: 'Needs Prayer',
                value: stats.needsPrayer,
                icon: Sparkles,
                color: 'amber',
            },
            {
                label: 'Answered Testimonies',
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
                    content: form.content.trim(),
                    authorName: form.authorName || undefined,
                    isAnonymous: form.isAnonymous,
                    isAnswered: form.isAnswered,
                    prayCount: form.prayCount,
                })
            } else {
                await onCreatePrayer({
                    title: form.title || undefined,
                    content: form.content.trim(),
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

    // Table view columns
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
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden text-muted-foreground border border-border/50 font-bold text-xs">
                                {avatar && !row.isAnonymous ? (
                                    <img src={resolveImage(avatar)} alt={name} className="size-full object-cover" />
                                ) : (
                                    name.charAt(0).toUpperCase()
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
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 hover:bg-emerald-500/20">
                                <CheckCircle2 className="size-3" /> Answered
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
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
                        <HandHeart className="size-3.5 text-primary shrink-0" />
                        <span>{row.prayCount}</span>
                    </div>
                ),
            },
            {
                key: 'createdAt',
                header: 'DATE',
                render: (row) => (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: 'ACTIONS',
                render: (row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionButton label="View prayer" onClick={() => setViewing(row)}>
                            <Eye className="size-4" />
                        </ActionButton>
                        <ActionButton label="Edit prayer" onClick={() => openEdit(row)}>
                            <Pencil className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label={row.isAnswered ? 'Mark unanswered' : 'Mark answered'}
                            onClick={() => toggleAnswered(row)}
                            className={row.isAnswered ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}
                        >
                            <CheckCircle2 className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label="Pray (+1)"
                            onClick={() => onPrayForPrayer(row.id)}
                            className="text-primary hover:bg-primary/10"
                        >
                            <HandHeart className="size-4" />
                        </ActionButton>
                        {row.deletedAt ? (
                            <ActionButton
                                label="Restore prayer"
                                onClick={() => restorePrayer(row)}
                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            >
                                <RotateCcw className="size-4" />
                            </ActionButton>
                        ) : (
                            <ActionButton
                                label="Delete prayer"
                                onClick={() => setDeleting(row)}
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="size-4" />
                            </ActionButton>
                        )}
                    </div>
                ),
            },
        ],
        [onPrayForPrayer],
    )

    return (
        <div className="flex w-full max-w-full flex-col gap-6">
            {/* Header + Action */}
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    title="Prayers"
                    description="Manage community prayer requests, track prayer support, and review testimonies."
                />
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={searchQuery}
                        onValueChange={onSearchChange}
                        placeholder="Search prayers..."
                        className="w-full sm:w-64"
                    />
                    <Button onClick={openCreate} className="gap-2 bg-[#53624D] hover:bg-[#43503e] text-white">
                        <Plus className="size-4" /> Add prayer
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <StatCardsGrid cards={statCards} />

            {/* Filter Tabs + Data Table */}
            <div className="flex flex-col gap-4">
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => onTabChange(val as 'all' | 'active' | 'answered' | 'deleted')}
                    className="w-full"
                >
                    <TabsList variant="line" className="mb-2 w-full max-w-full justify-start overflow-x-auto border-b border-border/50">
                        <TabsTrigger value="all" className="flex-none px-4">
                            All requests
                        </TabsTrigger>
                        <TabsTrigger value="active" className="flex-none px-4">
                            Needs prayer
                        </TabsTrigger>
                        <TabsTrigger value="answered" className="flex-none px-4">
                            Answered
                        </TabsTrigger>
                        <TabsTrigger value="deleted" className="flex-none px-4">
                            Archived
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <DataTable
                    columns={columns}
                    data={prayers}
                    loading={loading}
                    total={totalPrayers}
                    page={page}
                    limit={limit}
                    noun="prayers"
                    emptyIcon={<HandHeart className="size-6" />}
                    onReset={onResetSearch}
                />
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Prayer Request' : 'New Prayer Request'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Update this community prayer request.' : 'Post a prayer request for the community to stand in agreement.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="prayer-title">Title (Optional)</Label>
                            <Input
                                id="prayer-title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Healing for my mother, Guidance in career..."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="prayer-content">Prayer Content *</Label>
                            <Textarea
                                id="prayer-content"
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Share your prayer need, situation, or testimony..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="prayer-author">Author Name</Label>
                            <Input
                                id="prayer-author"
                                value={form.authorName}
                                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                                placeholder="Your name or community name"
                                disabled={form.isAnonymous}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="prayer-anon" className="text-sm font-medium">Post Anonymously</Label>
                                <p className="text-xs text-muted-foreground">Hide author identity from community members</p>
                            </div>
                            <Switch
                                id="prayer-anon"
                                checked={form.isAnonymous}
                                onCheckedChange={(checked) => setForm({ ...form, isAnonymous: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="prayer-answered" className="text-sm font-medium">Answered Testimony</Label>
                                <p className="text-xs text-muted-foreground">Mark this prayer as answered by the Lord</p>
                            </div>
                            <Switch
                                id="prayer-answered"
                                checked={form.isAnswered}
                                onCheckedChange={(checked) => setForm({ ...form, isAnswered: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitForm}
                            disabled={saving || !form.content.trim()}
                            className="bg-[#53624D] hover:bg-[#43503e] text-white"
                        >
                            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Prayer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="sm:max-w-xl">
                    {viewing && (
                        <>
                            <DialogHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                        <Quote className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <DialogTitle className="text-lg">
                                            {viewing.title || 'Community Prayer Request'}
                                        </DialogTitle>
                                        <DialogDescription className="flex items-center gap-2">
                                            <span>
                                                {viewing.isAnonymous ? 'Anonymous' : (viewing.authorName || viewing.user?.name || 'Member')}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(viewing.createdAt).toLocaleDateString()}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
                                    {viewing.content}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                            <HandHeart className="size-4 text-primary" />
                                            {viewing.prayCount} people prayed
                                        </span>
                                        {viewing.isAnswered ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                Answered
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                                                Needs Prayer
                                            </Badge>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onPrayForPrayer(viewing.id)}
                                        className="gap-1.5"
                                    >
                                        <HandHeart className="size-3.5 text-primary" />
                                        Pray (+1)
                                    </Button>
                                </div>
                            </div>

                            <DialogFooter className="border-t border-border/50 pt-3">
                                <Button variant="outline" onClick={() => setViewing(null)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Trash Confirmation */}
            <TrashConfirm
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                name={deleting?.title || 'this prayer request'}
                onConfirm={() => {
                    if (deleting) {
                        onDeletePrayer(deleting.id)
                        setDeleting(null)
                    }
                }}
            />
        </div>
    )
}
