import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Activity, Calendar, Eye, Plus, Users, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { CommunityGroup } from '@/lib/community'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { useAppForm } from '@/components/form/form-context'
import * as z from 'zod'

export const groupSchema = z.object({
    name: z.string().min(1, 'Group name is required'),
    category: z.string().min(1, 'Category is required'),
    memberCount: z.number().min(0, 'Member count cannot be negative'),
    status: z.enum(['Active', 'Inactive']),
})

export interface CommunityUIProps {
    groups: CommunityGroup[]
    totalGroups: number
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
    onCreateGroup: (data: Omit<CommunityGroup, 'id' | 'createdAt'>) => void
    onUpdateGroup: (id: number, data: Partial<CommunityGroup>) => void
    onDeleteGroup: (id: number) => void
}

function formatMembers(count: number) {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'K members'
    }
    return `${count} members`
}

export function CommunityUI({
    groups,
    totalGroups,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
    onCreateGroup,
    onUpdateGroup,
    onDeleteGroup,
}: CommunityUIProps) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingGroup, setEditingGroup] = useState<CommunityGroup | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Active', value: 'Active' },
                    { label: 'Inactive', value: 'Inactive' },
                ],
            },
            {
                id: 'createdAt',
                label: 'Created Date',
                icon: Calendar,
                type: 'date',
            },
        ],
        []
    )

    const columns: DataTableColumn<CommunityGroup>[] = useMemo(
        () => [
            {
                key: 'name',
                header: 'GROUP NAME',
                render: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center overflow-hidden border border-border/50">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <span className="text-foreground font-semibold">{row.name}</span>
                    </div>
                ),
            },
            { key: 'category', header: 'CATEGORY', render: (row) => <span className="text-muted-foreground">{row.category}</span> },
            { key: 'memberCount', header: 'MEMBERS', render: (row) => <span className="text-muted-foreground">{formatMembers(row.memberCount)}</span> },
            {
                key: 'createdAt',
                header: 'CREATED AT',
                render: (row) => {
                    const dateStr = new Date(row.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                    return <span className="text-muted-foreground">{dateStr}</span>
                },
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) =>
                    row.status === 'Active' ? (
                        <span className="flex items-center gap-1.5 text-success font-semibold text-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold text-sm">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                            Inactive
                        </span>
                    ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => {
                                setEditingGroup(row)
                                setIsFormOpen(true)
                            }}
                            className="p-2 rounded-full bg-orange-50 text-orange-400 hover:bg-orange-100 transition-colors"
                        >
                            <Eye className="size-4" />
                        </button>
                        <button
                            onClick={() => setDeletingId(row.id)}
                            className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        []
    )

    const handleFormSubmit = (values: z.infer<typeof groupSchema>) => {
        if (editingGroup) {
            onUpdateGroup(editingGroup.id, values)
        } else {
            onCreateGroup(values)
        }
        setIsFormOpen(false)
        setEditingGroup(null)
    }

    const openCreate = () => {
        setEditingGroup(null)
        setIsFormOpen(true)
    }

    return (
        <>
            <div className="flex flex-col w-full max-w-full relative">
                {/* Header & Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <PageHeader title="Community" className="shrink-0 text-xl font-bold text-chart-1" />
                    <div className="flex items-center flex-wrap gap-3">
                        <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search Groups..." className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border" />
                        <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 h-9">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Group
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col">
                    <DataTable
                        columns={columns}
                        data={groups}
                        total={totalGroups}
                        page={page}
                        limit={limit}
                        noun="groups"
                        emptyIcon={<Users className="h-6 w-6" />}
                        onReset={onResetSearch}
                    />
                </div>
            </div>

            <TrashConfirm
                isOpen={deletingId !== null}
                onClose={() => setDeletingId(null)}
                onConfirm={() => {
                    if (deletingId !== null) {
                        onDeleteGroup(deletingId)
                        setDeletingId(null)
                    }
                }}
            />

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
                        <DialogDescription>
                            {editingGroup ? 'Update the details for this community group.' : 'Add a new group to the community.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <GroupForm
                            defaultValues={
                                editingGroup || {
                                    name: '',
                                    category: '',
                                    memberCount: 0,
                                    status: 'Active',
                                }
                            }
                            onSubmit={handleFormSubmit}
                            submitLabel={editingGroup ? 'Save Changes' : 'Create Group'}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function GroupForm({
    defaultValues,
    onSubmit,
    submitLabel,
}: {
    defaultValues: {
        name: string
        category: string
        memberCount: number
        status: 'Active' | 'Inactive'
    }
    onSubmit: (values: z.infer<typeof groupSchema>) => void
    submitLabel: string
}) {
    const form = useAppForm({
        defaultValues,
        validators: { onChange: groupSchema },
        onSubmit: async ({ value }) => onSubmit(value),
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-1 gap-4">
                <form.AppField name="name">{(field) => <field.FormInput label="Group Name" placeholder="e.g. Women of Faith" />}</form.AppField>
                <form.AppField name="category">{(field) => <field.FormInput label="Category" placeholder="e.g. Discover" />}</form.AppField>
                <form.AppField name="memberCount">
                    {(field) => (
                        <field.FormInput
                            type="number"
                            label="Member Count"
                            placeholder="0"
                            onChange={(e) => field.handleChange(e.target.valueAsNumber || 0)}
                        />
                    )}
                </form.AppField>
                <form.AppField name="status">
                    {(field) => (
                        <field.FormSelect
                            label="Status"
                            options={[
                                { label: 'Active', value: 'Active' },
                                { label: 'Inactive', value: 'Inactive' },
                            ]}
                        />
                    )}
                </form.AppField>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitLabel}
                </Button>
            </div>
        </form>
    )
}
