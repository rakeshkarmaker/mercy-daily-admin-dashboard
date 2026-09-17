import { Field, FieldError, FieldLabel } from '@/components/shared/field'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Search, UserPlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useFieldContext } from './form-context'

type Option = { label: string; value: string }

const newGuestSchema = z.object({
    name: z.string().min(1, 'Name is required.'),
    email: z.email('Enter a valid email address.').toLowerCase(),
    phone: z.string().min(1, 'Phone is required.'),
})

type FormSearchableSelectProps = {
    label: string
    options: Option[]
    placeholder?: string
    searchPlaceholder?: string
    disabled?: boolean
    /** Allow adding a new guest inline */
    allowAddNew?: boolean
    addNewLabel?: string
    onAddNew?: (guest: { name: string; email: string; phone: string }) => void
}

export function FormSearchableSelect({
    label,
    options: initialOptions,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    disabled,
    allowAddNew = false,
    addNewLabel = 'Add new guest',
    onAddNew,
}: FormSearchableSelectProps) {
    const field = useFieldContext<string>()
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [options, setOptions] = useState<Option[]>(initialOptions)

    // Add-new-guest form state
    const [showAddNew, setShowAddNew] = useState(false)
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [addError, setAddError] = useState('')

    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)

    const selectedOption = options.find((o) => o.value === field.state.value)

    const filtered = search.trim() ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
                setShowAddNew(false)
                setNewName('')
                setNewEmail('')
                setNewPhone('')
                setAddError('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus search when opened
    useEffect(() => {
        if (open && !showAddNew) {
            setTimeout(() => searchRef.current?.focus(), 10)
        }
    }, [open, showAddNew])

    // Focus name field when add-new panel opens
    useEffect(() => {
        if (showAddNew) {
            setTimeout(() => nameRef.current?.focus(), 10)
        }
    }, [showAddNew])

    const handleSelect = (value: string) => {
        field.handleChange(value)
        field.handleBlur()
        setOpen(false)
        setSearch('')
        setShowAddNew(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        field.handleChange('')
        field.handleBlur()
        setSearch('')
    }

    const handleAddNewGuest = () => {
        const result = newGuestSchema.safeParse({ name: newName, email: newEmail, phone: newPhone })
        if (!result.success) {
            setAddError(result.error.issues[0].message)
            return
        }

        const { name, email, phone } = result.data
        if (options.some((o) => o.value === email)) {
            setAddError('This guest already exists.')
            return
        }

        if (onAddNew) {
            onAddNew({ name, email, phone })
        }

        setOptions((prev) => [...prev, { value: email, label: `${name} (${email})` }])
        field.handleChange(email)
        field.handleBlur()
        setOpen(false)
        setSearch('')
        setShowAddNew(false)
        setNewName('')
        setNewEmail('')
        setNewPhone('')
    }

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <div ref={containerRef} className="relative w-full">
                {/* Trigger button */}
                <button
                    id={field.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                        if (!disabled) setOpen((prev) => !prev)
                    }}
                    onBlur={() => {
                        if (!open) field.handleBlur()
                    }}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm',
                        'hover:border-primary/50 focus:outline-none',
                        'transition-colors duration-150',
                        disabled && 'cursor-not-allowed opacity-50',
                        isInvalid && 'border-destructive',
                    )}
                >
                    <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 ml-2">
                        {selectedOption && (
                            <span
                                role="button"
                                tabIndex={-1}
                                onClick={handleClear}
                                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}
                        <ChevronDown
                            className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
                        />
                    </span>
                </button>

                {/* Dropdown panel */}
                {open && (
                    <div
                        className={cn(
                            'absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden',
                            'animate-in fade-in-0 zoom-in-95 duration-100',
                        )}
                    >
                        {!showAddNew ? (
                            <>
                                {/* Search input */}
                                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Options list */}
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {filtered.length === 0 ? (
                                        <div className="px-3 py-5 text-center text-sm text-muted-foreground">No results found.</div>
                                    ) : (
                                        filtered.map((option) => {
                                            const isSelected = option.value === field.state.value
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleSelect(option.value)}
                                                    className={cn(
                                                        'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                                                        'hover:bg-accent hover:text-accent-foreground',
                                                        isSelected && 'bg-primary/5 text-primary font-medium',
                                                    )}
                                                >
                                                    <span className="flex-1 text-left truncate">{option.label}</span>
                                                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Add new guest footer */}
                                {allowAddNew && (
                                    <div className="border-t border-border">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddNew(true)}
                                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                                        >
                                            <UserPlus className="h-3.5 w-3.5 shrink-0" />
                                            {addNewLabel}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ── Add New Guest Panel ── */
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <UserPlus className="h-4 w-4 text-primary" />
                                        New Guest
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddNew(false)
                                            setNewName('')
                                            setNewEmail('')
                                            setNewPhone('')
                                            setAddError('')
                                        }}
                                        className="text-muted-foreground hover:text-foreground rounded-md p-0.5 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Name field */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                                    <input
                                        ref={nameRef}
                                        type="text"
                                        value={newName}
                                        onChange={(e) => {
                                            setNewName(e.target.value)
                                            setAddError('')
                                        }}
                                        placeholder="e.g. John Smith"
                                        className={cn(
                                            'flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none',
                                            'transition-shadow placeholder:text-muted-foreground',
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddNewGuest()
                                            }
                                        }}
                                    />
                                </div>

                                {/* Email field */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => {
                                            setNewEmail(e.target.value)
                                            setAddError('')
                                        }}
                                        placeholder="e.g. john@example.com"
                                        className={cn(
                                            'flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none',
                                            'transition-shadow placeholder:text-muted-foreground',
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddNewGuest()
                                            }
                                        }}
                                    />
                                </div>

                                {/* Phone field */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newPhone}
                                        onChange={(e) => {
                                            setNewPhone(e.target.value)
                                            setAddError('')
                                        }}
                                        placeholder="e.g. +1 416 XXX XXXX"
                                        className={cn(
                                            'flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm outline-none',
                                            'transition-shadow placeholder:text-muted-foreground',
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddNewGuest()
                                            }
                                        }}
                                    />
                                </div>

                                {/* Error message */}
                                {addError && <p className="text-xs text-destructive font-medium">{addError}</p>}

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddNew(false)
                                            setNewName('')
                                            setNewEmail('')
                                            setNewPhone('')
                                            setAddError('')
                                        }}
                                        className="flex-1 h-8 rounded-md border border-input text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddNewGuest}
                                        className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        Add Guest
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
