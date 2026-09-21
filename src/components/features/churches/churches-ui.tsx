import { useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatCard } from '@/components/shared/stat-card'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Building2,
    Calendar,
    Church as ChurchIcon,
    Eye,
    MapPin,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react'
import type { Church, ChurchInput } from '@/api/churches'

export interface ChurchesUIProps {
    churches: Church[]
    totalChurches: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onCreateChurch: (input: ChurchInput) => Promise<void>
    onUpdateChurch: (id: string, input: Partial<ChurchInput>) => Promise<void>
    onDeleteChurch: (id: string) => Promise<void>
}

type FormState = {
    name: string
    address: string
}

const emptyForm: FormState = {
    name: '',
    address: '',
}

export function ChurchesUI({
    churches,
    totalChurches,
    loading = false,
    page,
    limit,
    searchQuery,
    onSearchChange,
    onResetSearch,
    onCreateChurch,
    onUpdateChurch,
    onDeleteChurch,
}: ChurchesUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Church | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [viewing, setViewing] = useState<Church | null>(null)
    const [deleting, setDeleting] = useState<Church | null>(null)
    const [saving, setSaving] = useState(false)

    // KPI Metrics calculation
    const churchesWithAddress = churches.filter((c) => Boolean(c.address && c.address.trim().length > 0)).length
    const now = new Date()
    const thisMonth = churches.filter((c) => {
        const created = new Date(c.createdAt)
        return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
        )
    }).length

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setFormOpen(true)
    }

    const openEdit = (church: Church) => {
        setEditing(church)
        setForm({
            name: church.name,
            address: church.address ?? '',
        })
        setFormOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return

        try {
            setSaving(true)
            if (editing) {
                await onUpdateChurch(editing.id, {
                    name: form.name.trim(),
                    address: form.address.trim() || null,
                })
            } else {
                await onCreateChurch({
                    name: form.name.trim(),
                    address: form.address.trim() || null,
                })
            }
            setFormOpen(false)
            setForm(emptyForm)
            setEditing(null)
        } finally {
            setSaving(false)
        }
    }

    const columns: DataTableColumn<Church>[] = [
        {
            key: 'name',
            header: 'Church / Ministry',
            render: (church) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ChurchIcon className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate max-w-xs md:max-w-md">
                            {church.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-50">
                            ID: {church.id.slice(0, 8)}...
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'address',
            header: 'Location / Address',
            render: (church) => (
                <div className="flex items-center gap-2 max-w-xs md:max-w-sm">
                    <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                    {church.address ? (
                        <span className="text-sm text-foreground/90 truncate">
                            {church.address}
                        </span>
                    ) : (
                        <span className="text-xs italic text-muted-foreground">
                            No address specified
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Date Registered',
            render: (church) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Calendar className="size-3.5" />
                    {new Date(church.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (church) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="View Church Details"
                        onClick={() => setViewing(church)}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Edit Church"
                        onClick={() => openEdit(church)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        title="Delete Church"
                        onClick={() => setDeleting(church)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 w-full max-w-full pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title="Churches & Ministries"
                    description="Maintain church directory, coordinate regional ministry locations, and oversee member congregations."
                />
                <Button onClick={openCreate} className="gap-2 shrink-0">
                    <Plus className="size-4" />
                    <span>Add Church</span>
                </Button>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="Total Registered Churches"
                    value={totalChurches}
                    icon={ChurchIcon}
                    color="emerald"
                />
                <StatCard
                    label="With Physical Address"
                    value={churchesWithAddress}
                    icon={Building2}
                    color="blue"
                />
                <StatCard
                    label="Registered This Month"
                    value={thisMonth}
                    icon={Calendar}
                    color="amber"
                />
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <SearchInput
                    placeholder="Search churches by name or address..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="w-full sm:max-w-xs"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetSearch}
                        className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
                    >
                        Clear search
                    </Button>
                )}
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={churches}
                loading={loading}
                noun="churches"
                emptyIcon={<ChurchIcon className="size-10 text-muted-foreground/50" />}
                page={page}
                limit={limit}
                total={totalChurches}
                onReset={onResetSearch}
            />

            {/* Create / Edit Church Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ChurchIcon className="size-5 text-primary" />
                                <span>{editing ? 'Edit Church' : 'Add New Church'}</span>
                            </DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update details for this church congregation.'
                                    : 'Register a new church into the Mercy Daily network.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="church-name" className="text-sm font-medium">
                                    Church Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="church-name"
                                    placeholder="e.g. Grace Community Church"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                    minLength={2}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="church-address" className="text-sm font-medium">
                                    Address / Location
                                </Label>
                                <Textarea
                                    id="church-address"
                                    placeholder="e.g. 12 Faith Avenue, Suite 100, City, Country"
                                    rows={3}
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm((prev) => ({ ...prev, address: e.target.value }))
                                    }
                                    maxLength={500}
                                />
                                <span className="text-xs text-muted-foreground">
                                    Optional physical address or regional location. Max 500 characters.
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormOpen(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving || !form.name.trim()}>
                                {saving
                                    ? 'Saving...'
                                    : editing
                                      ? 'Update Church'
                                      : 'Create Church'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <ChurchIcon className="size-4" />
                            </div>
                            <span className="truncate">{viewing?.name}</span>
                        </DialogTitle>
                        <DialogDescription>Church profile & registration summary</DialogDescription>
                    </DialogHeader>

                    {viewing && (
                        <div className="flex flex-col gap-3 py-3 text-sm">
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Full Address
                                </span>
                                <div className="flex items-start gap-2 text-foreground font-medium mt-0.5">
                                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                                    <span>{viewing.address || 'No location specified.'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col p-3 rounded-lg bg-muted/40 border border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Registered On
                                    </span>
                                    <span className="text-foreground font-medium mt-1">
                                        {new Date(viewing.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex flex-col p-3 rounded-lg bg-muted/40 border border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Last Updated
                                    </span>
                                    <span className="text-foreground font-medium mt-1">
                                        {new Date(viewing.updatedAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col p-3 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Church ID (UUID)
                                </span>
                                <span className="font-mono text-xs text-foreground/80 break-all select-all mt-1">
                                    {viewing.id}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewing(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <TrashConfirm
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                name={deleting?.name ?? 'this church'}
                title="Delete Church?"
                description="Are you sure you want to remove"
                onConfirm={async () => {
                    if (deleting) {
                        await onDeleteChurch(deleting.id)
                        setDeleting(null)
                    }
                }}
            />
        </div>
    )
}
