import { DataTable } from '@/components/shared/data-table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Eye, UsersRound, Activity, Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'
import * as z from 'zod'
import type { DataTableColumn } from '@/components/shared/data-table'
import { useAppForm } from '@/components/form/form-context'
import type { User } from '#/lib/users'

export const userSchema = z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.email('Please enter a valid email address'),
    image: z.string(),
    phone: z.string(),
    role: z.enum(['User', 'Moderator']),
    verification: z.enum(['Verified', 'Unverified']),
    status: z.enum(['Active', 'Delete']),
})

export interface UserManagementUIProps {
    users: User[]
    totalUsers: number
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (q: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
    onSaveUser: (id: number | null, values: z.infer<typeof userSchema>) => void
    onToggleStatus: (id: number) => void
    onDeleteUser: (id: number) => void
}

export function UserManagementUI({
    users,
    totalUsers,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
    onSaveUser,
    onToggleStatus,
    onDeleteUser,
}: UserManagementUIProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Active', value: 'Active' },
                    { label: 'Delete', value: 'Delete' },
                ],
            },
            {
                id: 'joinDate',
                label: 'Join Date',
                icon: Calendar,
                type: 'date',
            },
        ],
        []
    )

    const isEditMode = editingUser !== null


    const openEdit = (user: User) => {
        setEditingUser(user)
        setIsOpen(true)
    }

    const closeDialog = () => {
        setIsOpen(false)
        setEditingUser(null)
    }

    const handleFormSubmit = (values: z.infer<typeof userSchema>) => {
        onSaveUser(isEditMode ? editingUser.id : null, values)
        closeDialog()
    }

    const columns: DataTableColumn<User>[] = useMemo(
        () => [
            {
                key: 'user',
                header: 'USER',
                render: (user) => (
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full overflow-hidden shrink-0 bg-muted">
                            <img src={user.image} alt={user.name} className="size-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                ),
            },
            { key: 'phone', header: 'PHONE', render: (user) => <span className="text-muted-foreground font-medium">{user.phone}</span> },
            { key: 'role', header: 'ROLE', render: (user) => <span className="text-muted-foreground font-medium">{user.role}</span> },
            { key: 'verification', header: 'VERIFICATION', render: (user) => <span className="text-muted-foreground font-medium">{user.verification}</span> },
            {
                key: 'status',
                header: 'STATUS',
                render: (user) =>
                    user.status === 'Active' ? (
                        <span className="text-success font-semibold text-sm">Active</span>
                    ) : (
                        <span className="text-red-500 font-semibold text-sm">Delete</span>
                    ),
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (user) => (
                    <div className="flex justify-center">
                        <button onClick={() => openEdit(user)} className="p-2 rounded-full bg-orange-50 text-orange-400 hover:bg-orange-100 transition-colors">
                            <Eye className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [onToggleStatus, onDeleteUser]
    )

    return (
        <>
            {/* Header & Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-border/50">
                <PageHeader title="User Management" className="shrink-0 text-xl font-bold text-chart-1" />
                <div className="flex items-center flex-wrap gap-3">
                    <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search..." className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border" />
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={users}
                total={totalUsers}
                page={page}
                limit={limit}
                noun="users"
                emptyIcon={<UsersRound className="h-6 w-6" />}
                onReset={onResetSearch}
            />

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) closeDialog()
                }}
            >
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-dialog-bg border-dialog-border">
                    <DialogHeader className="px-6 py-5 border-b border-dialog-border/70 m-0">
                        <DialogTitle className="text-3xl font-extrabold text-dialog-text">{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription className="text-[15px] font-medium text-dialog-muted mt-1">
                            {isEditMode ? `Modify details for ${editingUser?.name}.` : 'Enter the details of the new user to register them.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 pb-6 pt-2 max-h-[80vh] overflow-y-auto [&_label]:text-dialog-text [&_label]:text-[15px] [&_label]:font-medium [&_label]:mb-1.5 [&_label]:block [&_input]:bg-transparent [&_input]:border-dialog-border [&_input]:focus-visible:ring-primary/20 [&_input]:placeholder:text-muted-foreground/60 [&_input]:h-11 [&_input]:text-base [&_button[role=combobox]]:bg-transparent [&_button[role=combobox]]:border-dialog-border [&_button[role=combobox]]:h-11 [&_button[role=combobox]]:text-base">
                        <UserForm
                            key={editingUser?.id ?? 'add'}
                            defaultValues={
                                editingUser
                                    ? {
                                          name: editingUser.name,
                                          email: editingUser.email,
                                          image: editingUser.image,
                                          phone: editingUser.phone,
                                          role: editingUser.role,
                                          verification: editingUser.verification,
                                          status: editingUser.status,
                                      }
                                    : { name: '', email: '', image: '', phone: '', role: 'User', verification: 'Unverified', status: 'Active' }
                            }
                            onSubmit={handleFormSubmit}
                            submitLabel={isEditMode ? 'Save Changes' : 'Register User'}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function UserForm({
    defaultValues,
    onSubmit,
    submitLabel,
}: {
    defaultValues: {
        name: string
        email: string
        image: string
        phone: string
        role: 'User' | 'Moderator'
        verification: 'Verified' | 'Unverified'
        status: 'Active' | 'Delete'
    }
    onSubmit: (values: z.infer<typeof userSchema>) => void
    submitLabel: string
}) {
    const form = useAppForm({
        defaultValues,
        validators: { onChange: userSchema },
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
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="md:col-span-2">
                    <form.AppField name="name">{(field) => <field.FormInput label="Name" placeholder="Enter full name" />}</form.AppField>
                </div>

                <div className="md:col-span-2">
                    <form.AppField name="email">{(field) => <field.FormInput type="email" label="Email" placeholder="Enter email" />}</form.AppField>
                </div>
                
                <div className="md:col-span-2">
                    <form.AppField name="phone">{(field) => <field.FormInput type="tel" label="Phone" placeholder="Enter phone number" />}</form.AppField>
                </div>

                <div className="md:col-span-1">
                    <form.AppField name="role">
                        {(field) => (
                            <field.FormSelect
                                label="Role"
                                placeholder="Select role"
                                options={[
                                    { label: 'User', value: 'User' },
                                    { label: 'Moderator', value: 'Moderator' },
                                ]}
                            />
                        )}
                    </form.AppField>
                </div>

                <div className="md:col-span-1">
                    <form.AppField name="verification">
                        {(field) => (
                            <field.FormSelect
                                label="Verification"
                                placeholder="Select status"
                                options={[
                                    { label: 'Verified', value: 'Verified' },
                                    { label: 'Unverified', value: 'Unverified' },
                                ]}
                            />
                        )}
                    </form.AppField>
                </div>

                <div className="md:col-span-2">
                    <form.AppField name="image">{(field) => <field.FormImage label="Image" folder="users" />}</form.AppField>
                </div>
            </div>

            <form.AppForm>
                <form.FormSubmit label={submitLabel} className="w-full mt-4" />
            </form.AppForm>
        </form>
    )
}


