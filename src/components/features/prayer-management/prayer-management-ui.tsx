import { useEffect, useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    BookOpen,
    Calendar,
    CalendarPlus,
    Check,
    CheckSquare,
    Copy,
    Eye,
    HandHeart,
    Languages,
    TriangleAlert,
    Pencil,
    Plus,
    Quote,
    Search,
    Trash2,
} from 'lucide-react'
import type {
    Prayer,
    PrayerInput,
    PrayerSchedule,
    PrayerTranslation,
    PrayerTranslationInput,
    PrayerTranslationsSync,
    TodayPrayer,
} from '@/api/dailyprayers'
import { CONTENT_LANGUAGES, LANGUAGE_FILTER_OPTIONS } from '@/lib/language'
import type { ContentLanguage } from '@/lib/language'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterOption, FilterState } from '@/components/shared/filter-builder'
import { toast } from 'sonner'

export interface PrayerManagementUIProps {
    prayers: Prayer[]
    /** Full library for the schedule pickers (the paged `prayers` only holds one page). */
    libraryPrayers: Prayer[]
    schedules: PrayerSchedule[]
    todayPrayer?: TodayPrayer | null
    todayLoading?: boolean
    totalPrayers: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    activeTab?: 'today' | 'library' | 'schedules'
    onTabChange?: (tab: 'today' | 'library' | 'schedules') => void
    /** FilterBuilder state — the `language` select drives `?language=`. Omit = all languages. */
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onCreatePrayer: (input: PrayerInput, translations?: PrayerTranslationsSync) => Promise<void>
    onUpdatePrayer: (id: number, input: Partial<PrayerInput>, translations?: PrayerTranslationsSync | null) => Promise<void>
    onFetchTranslations?: (id: number) => Promise<PrayerTranslation[]>
    onDeletePrayer: (id: number) => Promise<void>
    onRecordView?: (id: number) => Promise<void>
    onSchedulePrayer: (id: number, scheduledFor: string) => Promise<void>
    onUpdateSchedule?: (id: number, input: { devotionId?: number; scheduledFor?: string }) => Promise<void>
    onDeleteSchedule?: (id: number) => Promise<void>
}

type FormState = PrayerInput

function formToTranslationInput(language: ContentLanguage, form: FormState): PrayerTranslationInput {
    return {
        language,
        verse: form.verse,
        reference: form.reference,
        reflection: form.reflection,
        prayer: form.prayer,
        practice: form.practice?.trim() ? form.practice : undefined,
    }
}

function isFormEmpty(form: FormState): boolean {
    return !form.verse.trim() && !form.reference.trim() && !form.reflection.trim() && !form.prayer.trim()
}

const ORDERED_LANGUAGES = ['en', 'esp', 'por'] as const

/** First filled tab wins — no picker needed. Empty tabs are ignored. */
function resolveBase(
    forms: Record<ContentLanguage, FormState>,
    storedBase?: ContentLanguage,
): ContentLanguage | undefined {
    if (storedBase && !isFormEmpty(forms[storedBase])) return storedBase
    return ORDERED_LANGUAGES.find((l) => !isFormEmpty(forms[l]))
}

/**
 * Stored API translations → per-tab edit forms. The base form (edited
 * separately) holds the row's own language; every other stored
 * translation fills its tab.
 */
function toLanguageForms(translations?: PrayerTranslation[], baseLanguage: ContentLanguage = 'en'): Record<ContentLanguage, FormState> {
    const forms = createEmptyLanguageForms()
    for (const translation of translations ?? []) {
        if (translation.language === baseLanguage) continue
        forms[translation.language] = {
            verse: translation.verse,
            reference: translation.reference,
            reflection: translation.reflection,
            prayer: translation.prayer,
            practice: translation.practice ?? '',
        }
    }
    return forms
}

/** Whether the row carries content in that language (originally or translated). */
function hasPrayerLanguage(row: Prayer, code: ContentLanguage): boolean {
    if ((row.language ?? 'en') === code) return true
    return (row.translations ?? []).some((t) => t.language === code)
}

function languageLabelsFor(row: Prayer): string {
    return CONTENT_LANGUAGES.filter((l) => hasPrayerLanguage(row, l.value))
        .map((l) => l.native)
        .join(', ')
}

/** Small language availability dot for verse/reference cells. */
function LanguageDot({ language, available }: { language: ContentLanguage; available: boolean }) {
    const label = CONTENT_LANGUAGES.find((l) => l.value === language)?.label ?? language
    return (
        <span
            title={`${label}: ${available ? 'available' : 'not translated'}`}
            className={`rounded px-1 py-px text-[10px] font-semibold tracking-wide ${
                available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/50 line-through'
            }`}
        >
            {label}
        </span>
    )
}


const emptyForm: FormState = {
    verse: '',
    reference: '',
    reflection: '',
    prayer: '',
    practice: '',
}

const createEmptyLanguageForms = (): Record<ContentLanguage, FormState> => ({
    en: { ...emptyForm },
    esp: { ...emptyForm },
    por: { ...emptyForm },
})

function formatScheduleDate(dateStr: string) {
    if (!dateStr) return ''
    const ymd = dateStr.slice(0, 10)
    const parts = ymd.split('-').map(Number)
    if (parts.length === 3 && !parts.some(isNaN)) {
        const [year, month, day] = parts
        const d = new Date(year, month - 1, day)
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }
    return new Date(dateStr).toLocaleDateString()
}

function getScheduleStatus(dateStr: string) {
    if (!dateStr) return { label: 'Scheduled', color: 'bg-muted text-muted-foreground border-border' }
    const today = new Date()
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const targetYMD = dateStr.slice(0, 10)

    const targetDate = new Date(`${targetYMD}T00:00:00`)
    const todayDate = new Date(`${todayYMD}T00:00:00`)
    const diffTime = targetDate.getTime() - todayDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return { label: 'Today', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    } else if (diffDays === 1) {
        return { label: 'Tomorrow', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    } else if (diffDays > 1) {
        return { label: `In ${diffDays} days`, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' }
    } else if (diffDays === -1) {
        return { label: 'Yesterday', color: 'bg-muted text-muted-foreground border-border' }
    } else {
        return { label: `${Math.abs(diffDays)} days ago`, color: 'bg-muted text-muted-foreground border-border' }
    }
}

/** Content of one language inside the view dialog (falls back to the original fields). */
function ViewLanguageContent({ prayer, language }: { prayer: Prayer; language: ContentLanguage }) {
    const base = prayer.language ?? 'en'
    const baseLabel = CONTENT_LANGUAGES.find((l) => l.value === base)?.label ?? base
    const translation = (prayer.translations ?? []).find((t) => t.language === language)
    const exists = language === base || Boolean(translation)

    const reference = language === base ? prayer.reference : (translation?.reference ?? prayer.reference)
    const verse = language === base ? prayer.verse : (translation?.verse ?? prayer.verse)
    const reflection = language === base ? prayer.reflection : (translation?.reflection ?? prayer.reflection)
    const guided = language === base ? prayer.prayer : (translation?.prayer ?? prayer.prayer)
    const practice = language === base ? prayer.practice : (translation?.practice ?? prayer.practice)

    return (
        <div className="space-y-4">
            {!exists && (
                <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    <Languages className="size-3.5" />
                    Not translated yet — showing the {baseLabel} content as fallback.
                </p>
            )}
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Scripture Verse
                    </span>
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold">
                        {reference}
                    </Badge>
                </div>
                <p className="text-lg font-medium leading-relaxed text-foreground italic">“{verse}”</p>
            </section>
            <section className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <BookOpen className="size-4 text-primary" />
                    <h4>Daily Reflection</h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{reflection}</p>
            </section>
            <section className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <HandHeart className="size-4 text-primary" />
                    <h4>Guided Prayer</h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{guided}</p>
            </section>
            <section className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <CheckSquare className="size-4 text-primary" />
                    <h4>Practical Faith Step (Optional)</h4>
                </div>
                {practice ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{practice}</p>
                ) : (
                    <p className="text-xs text-muted-foreground/60 italic">No practical faith step specified for this prayer.</p>
                )}
            </section>
        </div>
    )
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

export function PrayerManagementUI({
    prayers,
    libraryPrayers,
    schedules,
    todayPrayer,
    todayLoading = false,
    totalPrayers,
    loading = false,
    page,
    limit,
    searchQuery,
    activeTab = 'today',
    onTabChange,
    filters,
    onFiltersChange,
    onSearchChange,
    onResetSearch,
    onCreatePrayer,
    onUpdatePrayer,
    onFetchTranslations,
    onDeletePrayer,
    onRecordView,
    onSchedulePrayer,
    onUpdateSchedule,
    onDeleteSchedule,
}: PrayerManagementUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Prayer | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [languageForms, setLanguageForms] = useState<Record<ContentLanguage, FormState>>(createEmptyLanguageForms)
    const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>('en')

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'language',
                label: 'Language',
                icon: Languages,
                type: 'select',
                options: LANGUAGE_FILTER_OPTIONS,
            },
        ],
        [],
    )
    const [viewing, setViewing] = useState<Prayer | null>(null)
    const [viewLanguage, setViewLanguage] = useState<ContentLanguage>('en')
    const [deleting, setDeleting] = useState<Prayer | null>(null)
    /** Preselected prayer when the create dialog opens from a library row. */
    const [schedulePresetId, setSchedulePresetId] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    // Schedule management state
    const [editingSchedule, setEditingSchedule] = useState<PrayerSchedule | null>(null)
    const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
    const [deletingSchedule, setDeletingSchedule] = useState<PrayerSchedule | null>(null)

    const openView = (prayer: Prayer) => {
        setViewing(prayer)
        setViewLanguage(prayer.language ?? 'en')
        // Count the view (fire-and-forget; the route refreshes the counters).
        if (onRecordView) onRecordView(prayer.id).catch(() => undefined)
    }

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setLanguageForms(createEmptyLanguageForms())
        setActiveLanguage('en')
        setFormOpen(true)
    }

    const openEdit = (prayer: Prayer) => {
        const base = prayer.language ?? 'en'
        setEditing(prayer)
        setActiveLanguage(base)
        setForm({
            verse: prayer.verse,
            reference: prayer.reference,
            reflection: prayer.reflection,
            prayer: prayer.prayer,
            practice: prayer.practice ?? '',
        })
        // Preload saved translations into the language tabs (the base tab
        // edits the base row). Rows from the list/detail endpoints already
        // carry `translations`, so this is synchronous — no wipe race, no stale
        // tabs leaking in from a previous edit.
        setLanguageForms(toLanguageForms(prayer.translations, base))
        setFormOpen(true)
        // Fallback for rows without embedded translations (defensive).
        if (!prayer.translations && onFetchTranslations) {
            onFetchTranslations(prayer.id)
                .then((translations) => setLanguageForms(toLanguageForms(translations, base)))
                .catch(() => undefined)
        }
    }

    const handleEditToday = () => {
        if (!todayPrayer) return
        if (todayPrayer.id) {
            openEdit({
                id: todayPrayer.id,
                verse: todayPrayer.verse,
                reference: todayPrayer.reference,
                reflection: todayPrayer.reflection,
                prayer: todayPrayer.prayer,
                practice: todayPrayer.practice ?? '',
                viewsCount: todayPrayer.viewsCount ?? 0,
                language: todayPrayer.language ?? 'en',
                translations: todayPrayer.translations ?? [],
                createdAt: todayPrayer.createdAt ?? new Date().toISOString(),
                updatedAt: todayPrayer.updatedAt ?? new Date().toISOString(),
            })
        } else {
            const match = prayers.find((p) => p.reference === todayPrayer.reference)
            if (match) {
                openEdit(match)
            } else {
                const base = todayPrayer.language ?? 'en'
                setEditing(null)
                setActiveLanguage(base)
                setForm({
                    verse: todayPrayer.verse,
                    reference: todayPrayer.reference,
                    reflection: todayPrayer.reflection,
                    prayer: todayPrayer.prayer,
                    practice: todayPrayer.practice ?? '',
                })
                setFormOpen(true)
            }
        }
    }

    const handleCopyTodayDevotion = () => {
        if (!todayPrayer) return
        const text = `📖 Verse: ${todayPrayer.reference}\n"${todayPrayer.verse}"\n\n🕊️ Reflection:\n${todayPrayer.reflection}\n\n🙏 Prayer:\n${todayPrayer.prayer}${
            todayPrayer.practice ? `\n\n✨ Faith Practice:\n${todayPrayer.practice}` : ''
        }`
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Today's devotion copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const submitForm = async () => {
        // First filled tab wins — no picker needed. Empty tabs are ignored
        // on create and clear that translation on edit.
        if (editing) {
            const storedBase = editing.language ?? 'en'
            // If the base tab was emptied but another tab is filled, the base
            // shifts to that tab (backend folds the old translation away).
            const shifted = isFormEmpty(form) ? resolveBase(languageForms, undefined) : undefined
            const base: ContentLanguage = shifted ?? storedBase
            const values = shifted ? languageForms[shifted] : form
            if (!values.verse.trim() || !values.reference.trim() || !values.prayer.trim()) return
            setSaving(true)
            try {
                const others = (['en', 'esp', 'por'] as ContentLanguage[]).filter((l) => l !== base)
                const items: PrayerTranslationInput[] = others
                    .filter((l) => !isFormEmpty(languageForms[l]))
                    .map((l) => formToTranslationInput(l, languageForms[l]))
                const clearLanguages = others.filter((l) => isFormEmpty(languageForms[l]))
                const translations: PrayerTranslationsSync = { items, clearLanguages }
                await onUpdatePrayer(editing.id, { ...values, language: base }, translations)
                setFormOpen(false)
            } finally {
                setSaving(false)
            }
            return
        }
        const base = resolveBase(languageForms, undefined)
        if (!base) return
        const values = languageForms[base]
        if (!values.verse.trim() || !values.reference.trim() || !values.prayer.trim()) return
        setSaving(true)
        try {
            const items = (['en', 'esp', 'por'] as ContentLanguage[])
                .filter((l) => l !== base && !isFormEmpty(languageForms[l]))
                .map((l) => formToTranslationInput(l, languageForms[l]))
            await onCreatePrayer({ ...values, language: base }, { items })
            setFormOpen(false)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateSchedule = async (date: string, prayerId: number) => {
        if (!editingSchedule) return
        setSaving(true)
        try {
            if (onUpdateSchedule) {
                await onUpdateSchedule(editingSchedule.id, {
                    scheduledFor: date,
                    devotionId: prayerId,
                })
            } else {
                await onSchedulePrayer(prayerId, date)
            }
            setEditingSchedule(null)
        } finally {
            setSaving(false)
        }
    }

    const handleCreateSchedule = async (prayerId: number, date: string) => {
        setSaving(true)
        try {
            await onSchedulePrayer(prayerId, date)
            setCreateScheduleOpen(false)
            setSchedulePresetId(null)
        } finally {
            setSaving(false)
        }
    }

    /** Single entry point for scheduling: optional preset when opened from a library row. */
    const openCreateSchedule = (prayerId?: number) => {
        setSchedulePresetId(prayerId ?? null)
        setCreateScheduleOpen(true)
    }

    const scheduleColumns = useMemo<DataTableColumn<PrayerSchedule>[]>(
        () => [
            {
                key: 'scheduledFor',
                header: 'SCHEDULED DATE',
                render: (row) => {
                    const status = getScheduleStatus(row.scheduledFor)
                    return (
                        <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold text-foreground">
                                {formatScheduleDate(row.scheduledFor)}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    )
                },
            },
            {
                key: 'reference',
                header: 'REFERENCE',
                render: (row) => (
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="font-semibold text-foreground">{row.prayer.reference}</span>
                        <span className="flex flex-none items-center gap-0.5" title={`Languages: ${languageLabelsFor(row.prayer)}`}>
                            {CONTENT_LANGUAGES.map((l) => (
                                <LanguageDot key={l.value} language={l.value} available={hasPrayerLanguage(row.prayer, l.value)} />
                            ))}
                        </span>
                    </div>
                ),
            },
            {
                key: 'verse',
                header: 'SCRIPTURE VERSE',
                render: (row) => <span className="line-clamp-2 max-w-72 break-words text-muted-foreground italic">“{row.prayer.verse}”</span>,
            },
            {
                key: 'prayer',
                header: 'PRAYER / REFLECTION',
                render: (row) => (
                    <span className="line-clamp-2 max-w-72 break-words text-muted-foreground">
                        {row.prayer.reflection || row.prayer.prayer}
                    </span>
                ),
            },
            {
                key: 'actions',
                header: 'ACTIONS',
                render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                        <ActionButton label="View Devotional" onClick={() => openView(row.prayer)}>
                            <Eye className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label="Reschedule / Edit Date"
                            onClick={() => setEditingSchedule(row)}
                            className="text-[#53624D] hover:bg-[#53624D]/10"
                        >
                            <Calendar className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label="Remove Schedule Override"
                            onClick={() => setDeletingSchedule(row)}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="size-4" />
                        </ActionButton>
                    </div>
                ),
            },
        ],
        [],
    )

    const columns = useMemo<DataTableColumn<Prayer>[]>(
        () => [
            {
                key: 'verse',
                header: 'VERSE',
                render: (row) => (
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-semibold text-foreground line-clamp-2 max-w-52 break-words">{row.verse}</span>
                        <span className="flex items-center gap-0.5" title={`Languages: ${languageLabelsFor(row)}`}>
                            {CONTENT_LANGUAGES.map((l) => (
                                <LanguageDot key={l.value} language={l.value} available={hasPrayerLanguage(row, l.value)} />
                            ))}
                        </span>
                    </div>
                ),
            },
            { key: 'reference', header: 'REFERENCE', render: (row) => <span className="text-muted-foreground">{row.reference}</span> },
            {
                key: 'prayer',
                header: 'PRAYER',
                render: (row) => <span className="text-muted-foreground line-clamp-2 max-w-60 break-words">{row.prayer}</span>,
            },
            {
                key: 'updatedAt',
                header: 'UPDATED',
                render: (row) => <span className="text-muted-foreground">{new Date(row.updatedAt).toLocaleDateString()}</span>,
            },
            {
                key: 'actions',
                header: 'ACTIONS',
                render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                        <ActionButton label="View" onClick={() => openView(row)}><Eye className="size-4" /></ActionButton>
                        <ActionButton label="Edit" onClick={() => openEdit(row)}><Pencil className="size-4" /></ActionButton>
                        <ActionButton
                            label="Schedule for Today"
                            onClick={() => onSchedulePrayer(row.id, new Date().toISOString().slice(0, 10))}
                            className="text-success hover:bg-success/10"
                        >
                            <CheckSquare className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label="Schedule Date"
                            onClick={() => openCreateSchedule(row.id)}
                            className="text-info hover:bg-info/10"
                        >
                            <Calendar className="size-4" />
                        </ActionButton>
                        <ActionButton
                            label="Delete"
                            onClick={() => setDeleting(row)}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="size-4" />
                        </ActionButton>
                    </div>
                ),
            },
        ],
        [onSchedulePrayer],
    )

    return (
        <div className="flex w-full min-w-0 max-w-full flex-col gap-4">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    title="Daily Prayers"
                    description="Manage today's active devotion, daily prayer library, and scheduled overrides."
                />
                <div className="flex flex-wrap items-center gap-3">
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
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

            <Tabs
                value={activeTab}
                onValueChange={(val) => onTabChange?.(val as 'today' | 'library' | 'schedules')}
                className="w-full min-w-0"
            >
                <TabsList variant="line" className="mb-4 w-full max-w-full justify-start overflow-x-auto border-b border-border/50">
                    <TabsTrigger value="today" className="flex-none px-4 gap-2">
                        Today's prayer
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            Live
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="library" className="flex-none px-4">
                        Prayer library
                    </TabsTrigger>
                    <TabsTrigger value="schedules" className="flex-none px-4 gap-1.5">
                        Schedules
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                            {schedules.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: Today's Prayer ── */}
                <TabsContent value="today" className="min-w-0 space-y-6">
                    {todayLoading ? (
                        <div className="space-y-4">
                            <div className="h-28 rounded-xl bg-muted/60 animate-pulse border border-border/50" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="h-44 rounded-xl bg-muted/60 animate-pulse border border-border/50" />
                                <div className="h-44 rounded-xl bg-muted/60 animate-pulse border border-border/50" />
                            </div>
                        </div>
                    ) : todayPrayer ? (
                        <div className="space-y-6">
                            {/* Today's Devotion Hero Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex size-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                                Active on Mobile App Today
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            {new Date(`${todayPrayer.date}T00:00:00`).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyTodayDevotion}
                                            className="gap-1.5 cursor-pointer"
                                        >
                                            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                            {copied ? 'Copied' : 'Copy devotion'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleEditToday}
                                            className="gap-1.5 cursor-pointer"
                                        >
                                            <Pencil className="size-3.5" /> Edit today's prayer
                                        </Button>
                                    </div>
                                </div>

                                {/* Scripture Verse Hero */}
                                <div className="my-5 rounded-xl border border-primary/20 bg-primary/5 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
                                            <Quote className="size-5" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                                    Scripture Verse
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    {(() => {
                                                        const base = todayPrayer.language ?? 'en'
                                                        const codes = [base, ...((todayPrayer.translations ?? []).map((t) => t.language))]
                                                        return (
                                                            <span
                                                                className="flex items-center gap-0.5"
                                                                title={`Languages: ${codes.map((code) => CONTENT_LANGUAGES.find((l) => l.value === code)?.label ?? code).join(', ')}`}
                                                            >
                                                                {CONTENT_LANGUAGES.map((l) => (
                                                                    <LanguageDot
                                                                        key={l.value}
                                                                        language={l.value}
                                                                        available={l.value === base || (todayPrayer.translations ?? []).some((t) => t.language === l.value)}
                                                                    />
                                                                ))}
                                                            </span>
                                                        )
                                                    })()}
                                                    <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold">
                                                        {todayPrayer.reference}
                                                    </Badge>
                                                </span>
                                            </div>
                                            <p className="text-lg font-medium leading-relaxed text-foreground italic">
                                                “{todayPrayer.verse}”
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2-Column: Guided Prayer & Daily Reflection */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-2">
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            <HandHeart className="size-4 text-primary" />
                                            <h4>Guided Prayer</h4>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                            {todayPrayer.prayer}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-2">
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            <BookOpen className="size-4 text-primary" />
                                            <h4>Daily Reflection</h4>
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                                            {todayPrayer.reflection}
                                        </p>
                                    </div>
                                </div>

                                {/* Practical Faith Step (Optional) */}
                                <div className="mt-4 rounded-xl border border-border/70 bg-muted/15 p-5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            <CheckSquare className="size-4 text-primary" />
                                            <h4>Practical Faith Step (Optional)</h4>
                                        </div>
                                        {!todayPrayer.practice && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleEditToday}
                                                className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                                            >
                                                <Plus className="size-3" /> Add step
                                            </Button>
                                        )}
                                    </div>
                                    {todayPrayer.practice ? (
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {todayPrayer.practice}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground/60 italic">
                                            No practical faith step configured for today's prayer yet. Click &quot;Add step&quot; to configure one.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center border border-dashed rounded-xl">
                            <HandHeart className="size-8 text-muted-foreground" />
                            <h4 className="font-semibold text-foreground">No prayer scheduled for today</h4>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Select a prayer from the prayer library to schedule it as today's active devotion.
                            </p>
                            <Button variant="outline" onClick={() => onTabChange?.('library')}>
                                Browse Prayer Library
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* ── Tab 2: Prayer Library ── */}
                <TabsContent value="library" className="min-w-0">
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
                </TabsContent>

                {/* ── Tab 3: Schedules ── */}
                <TabsContent value="schedules" className="min-w-0 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-semibold text-foreground">Scheduled Overrides ({schedules.length})</h3>
                            <p className="text-xs text-muted-foreground">
                                Specific date overrides that take precedence over the serial daily rotation for all community members.
                            </p>
                        </div>
                        <Button
                            onClick={() => openCreateSchedule()}
                            className="gap-2 bg-[#53624D] hover:bg-[#43503e] text-white shrink-0"
                            size="sm"
                        >
                            <CalendarPlus className="size-4" /> Schedule prayer
                        </Button>
                    </div>

                    <DataTable
                        columns={scheduleColumns}
                        data={schedules}
                        total={schedules.length}
                        page={1}
                        limit={schedules.length || 1}
                        noun="scheduled prayers"
                        emptyIcon={<Calendar className="size-6" />}
                    />
                </TabsContent>
            </Tabs>

            {/* Create / Edit Dialog */}
            <PrayerFormDialog
                open={formOpen}
                editing={editing}
                form={form}
                languageForms={languageForms}
                activeLanguage={activeLanguage}
                saving={saving}
                onOpenChange={setFormOpen}
                onChange={setForm}
                onLanguageChange={(language) => setActiveLanguage(language)}
                onLanguageFormChange={(language, nextForm) =>
                    setLanguageForms((previous) => ({ ...previous, [language]: nextForm }))
                }
                onSubmit={submitForm}
            />

            {/* View Full Prayer Dialog */}
            <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    {viewing && (
                        <>
                            <DialogHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-start gap-3 pr-6">
                                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                        <Quote className="size-5" />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <DialogTitle className="text-xl">{viewing.reference}</DialogTitle>
                                        <DialogDescription>
                                            Prayer #{viewing.id} · Created {new Date(viewing.createdAt).toLocaleDateString()} · {(viewing.viewsCount ?? 0).toLocaleString()} views
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                {/* Language sub-tabs: per-language content, EN first. */}
                                <Tabs value={viewLanguage} onValueChange={(value) => setViewLanguage(value as ContentLanguage)} className="gap-3">
                                    <TabsList className="grid h-10 w-full grid-cols-3">
                                        {CONTENT_LANGUAGES.map((language) => (
                                            <TabsTrigger key={language.value} value={language.value}>
                                                {language.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {CONTENT_LANGUAGES.map((language) => (
                                        <TabsContent key={language.value} value={language.value}>
                                            <ViewLanguageContent prayer={viewing} language={language.value} />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </div>
                            <DialogFooter className="border-t border-border/50 pt-3">
                                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                                <Button
                                    onClick={() => {
                                        const toEdit = viewing
                                        setViewing(null)
                                        openEdit(toEdit)
                                    }}
                                    className="gap-1.5 bg-[#53624D] hover:bg-[#43503e] text-white"
                                >
                                    <Pencil className="size-3.5" /> Edit prayer
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
                name={deleting?.reference || 'this prayer'}
                onConfirm={() => {
                    if (deleting) {
                        onDeletePrayer(deleting.id)
                        setDeleting(null)
                    }
                }}
            />

            {/* Trash Confirmation for Schedule Override */}
            <TrashConfirm
                open={deletingSchedule !== null}
                onOpenChange={(open) => !open && setDeletingSchedule(null)}
                title="Remove Schedule Override?"
                description="Are you sure you want to remove the schedule override for"
                name={
                    deletingSchedule
                        ? `${formatScheduleDate(deletingSchedule.scheduledFor)} (${deletingSchedule.prayer.reference})`
                        : 'this schedule override'
                }
                onConfirm={() => {
                    if (deletingSchedule) {
                        onDeleteSchedule?.(deletingSchedule.id)
                        setDeletingSchedule(null)
                    }
                }}
            />

            {/* Edit / Reschedule Dialog */}
            <EditScheduleDialog
                schedule={editingSchedule}
                prayers={libraryPrayers}
                schedules={schedules}
                saving={saving}
                onOpenChange={(open) => !open && setEditingSchedule(null)}
                onSave={handleUpdateSchedule}
            />

            {/* Create Schedule Dialog */}
            <CreateScheduleDialog
                open={createScheduleOpen}
                prayers={libraryPrayers}
                schedules={schedules}
                initialPrayerId={schedulePresetId}
                saving={saving}
                onOpenChange={setCreateScheduleOpen}
                onSchedule={handleCreateSchedule}
            />
        </div>
    )
}

function PrayerFormDialog({
    open,
    editing,
    form,
    languageForms,
    activeLanguage,
    saving,
    onOpenChange,
    onChange,
    onLanguageChange,
    onLanguageFormChange,
    onSubmit,
}: {
    open: boolean
    editing: Prayer | null
    form: FormState
    languageForms: Record<ContentLanguage, FormState>
    activeLanguage: ContentLanguage
    saving: boolean
    onOpenChange: (open: boolean) => void
    onChange: (form: FormState) => void
    onLanguageChange: (language: ContentLanguage) => void
    onLanguageFormChange: (language: ContentLanguage, form: FormState) => void
    onSubmit: () => Promise<void>
}) {
    // First filled tab wins — no picker needed. Edit: the stored base tab
    // edits the base row, the other tabs edit the translation forms.
    const storedBase = editing ? (editing.language ?? 'en') : undefined
    const isBaseTab = editing ? activeLanguage === storedBase : true
    const activeForm = editing && isBaseTab ? form : languageForms[activeLanguage]
    const updateField = (field: keyof FormState, value: string) => {
        if (editing && isBaseTab) {
            onChange({ ...form, [field]: value })
            return
        }
        onLanguageFormChange(activeLanguage, {
            ...languageForms[activeLanguage],
            [field]: value,
        })
    }
    const checkForm = editing
        ? (isFormEmpty(form) ? (resolveBase(languageForms, undefined) ? languageForms[resolveBase(languageForms, undefined)!] : form) : form)
        : (resolveBase(languageForms, undefined) ? languageForms[resolveBase(languageForms, undefined)!] : languageForms.en)
    const canSubmit = checkForm.verse.trim() && checkForm.reference.trim() && checkForm.prayer.trim()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Daily Prayer' : 'Create Daily Prayer'}</DialogTitle>
                    <DialogDescription>
                        Fill any language tab — the first filled tab becomes the prayer. Empty tabs are ignored.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 border-b border-border/50 pb-2">
                    {CONTENT_LANGUAGES.map((lang) => {
                        const tabForm = editing && lang.value === storedBase ? form : languageForms[lang.value]
                        const filled = !isFormEmpty(tabForm)
                        return (
                            <Button
                                key={lang.value}
                                type="button"
                                variant={activeLanguage === lang.value ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => onLanguageChange(lang.value)}
                                className={activeLanguage === lang.value ? 'bg-[#53624D] hover:bg-[#43503e] text-white' : ''}
                            >
                                {lang.label}
                                {filled && (
                                    <span className="ml-1.5 inline-block size-1.5 rounded-full bg-current" aria-hidden />
                                )}
                            </Button>
                        )
                    })}
                </div>

                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Scripture Reference *</label>
                            <Input
                                value={activeForm.reference}
                                onChange={(e) => updateField('reference', e.target.value)}
                                placeholder="e.g. John 3:16"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Scripture Verse *</label>
                            <Input
                                value={activeForm.verse}
                                onChange={(e) => updateField('verse', e.target.value)}
                                placeholder="e.g. For God so loved the world..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Daily Reflection *</label>
                        <Textarea
                            value={activeForm.reflection}
                            onChange={(e) => updateField('reflection', e.target.value)}
                            placeholder="Write an inspirational reflection on the verse..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Guided Prayer *</label>
                        <Textarea
                            value={activeForm.prayer}
                            onChange={(e) => updateField('prayer', e.target.value)}
                            placeholder="Write a guided prayer..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Practical Faith Step (Optional)</label>
                        <Textarea
                            value={activeForm.practice ?? ''}
                            onChange={(e) => updateField('practice', e.target.value)}
                            placeholder="A tangible step of faith for the believer today..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={saving || !canSubmit}
                        className="bg-[#53624D] hover:bg-[#43503e] text-white"
                    >
                        {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Prayer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PrayerSelector({
    prayers,
    selectedId,
    onSelect,
}: {
    prayers: Prayer[]
    selectedId: number | null
    onSelect: (id: number) => void
}) {
    const [search, setSearch] = useState('')
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return prayers
        return prayers.filter(
            (p) =>
                p.reference.toLowerCase().includes(query) ||
                p.verse.toLowerCase().includes(query) ||
                p.reflection.toLowerCase().includes(query) ||
                p.prayer.toLowerCase().includes(query),
        )
    }, [prayers, search])
    // Cap the unfiltered render for large libraries; searching shows every match.
    const visible = search.trim() ? filtered : filtered.slice(0, 100)

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search prayer by reference or verse..."
                    className="pl-8 text-xs h-9"
                />
            </div>
            <p className="text-[11px] text-muted-foreground">
                {search.trim()
                    ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`
                    : `Showing ${visible.length} of ${prayers.length} prayers — type to search the full library`}
            </p>
            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-lg border border-border/60 p-1.5 bg-background">
                {filtered.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                        No prayers matching "{search}"
                    </div>
                ) : (
                    visible.map((prayer) => {
                        const isSelected = prayer.id === selectedId
                        return (
                            <button
                                key={prayer.id}
                                type="button"
                                onClick={() => onSelect(prayer.id)}
                                className={`w-full text-left p-2.5 rounded-md transition-colors cursor-pointer text-xs border ${
                                    isSelected
                                        ? 'border-[#53624D] bg-[#53624D]/10 text-foreground font-medium'
                                        : 'border-transparent hover:bg-muted/60 text-muted-foreground'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-foreground">{prayer.reference}</span>
                                    {isSelected && <Check className="size-3.5 text-[#53624D]" />}
                                </div>
                                <p className="line-clamp-1 italic mt-0.5 opacity-90">“{prayer.verse}”</p>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}

function EditScheduleDialog({
    schedule,
    prayers,
    schedules,
    saving,
    onOpenChange,
    onSave,
}: {
    schedule: PrayerSchedule | null
    prayers: Prayer[]
    schedules: PrayerSchedule[]
    saving: boolean
    onOpenChange: (open: boolean) => void
    onSave: (date: string, prayerId: number) => Promise<void>
}) {
    const today = new Date().toISOString().slice(0, 10)
    const [date, setDate] = useState('')
    const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)

    useEffect(() => {
        if (schedule) {
            setDate(schedule.scheduledFor.slice(0, 10))
            setSelectedPrayerId(schedule.prayer.id)
        }
    }, [schedule])

    if (!schedule) return null

    const currentAssigned = prayers.find((p) => p.id === selectedPrayerId) || schedule.prayer
    // A date move onto another override's date fails server-side — flag it upfront.
    const conflict = schedules.find(
        (s) => s.id !== schedule.id && s.scheduledFor.slice(0, 10) === date,
    )

    return (
        <Dialog open={schedule !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Schedule Override</DialogTitle>
                    <DialogDescription>
                        Update the assigned date or choose a different prayer for this date override.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Scheduled Date</label>
                        <Input
                            type="date"
                            value={date}
                            min={today}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {conflict && (
                        <ScheduleConflictWarning
                            message={`${conflict.prayer.reference} already uses ${formatScheduleDate(date)} — pick a free date or remove that override first.`}
                        />
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Currently Selected</label>
                        <div className="rounded-lg border border-border/80 bg-muted/30 p-2.5 text-xs">
                            <p className="font-semibold text-foreground">{currentAssigned.reference}</p>
                            <p className="line-clamp-2 italic text-muted-foreground mt-0.5">“{currentAssigned.verse}”</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Change Prayer</label>
                        <PrayerSelector
                            prayers={prayers}
                            selectedId={selectedPrayerId}
                            onSelect={setSelectedPrayerId}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (date && selectedPrayerId) {
                                onSave(date, selectedPrayerId)
                            }
                        }}
                        disabled={saving || !date || !selectedPrayerId || Boolean(conflict)}
                        className="bg-[#53624D] hover:bg-[#43503e] text-white"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CreateScheduleDialog({
    open,
    prayers,
    schedules,
    initialPrayerId,
    saving,
    onOpenChange,
    onSchedule,
}: {
    open: boolean
    prayers: Prayer[]
    schedules: PrayerSchedule[]
    initialPrayerId: number | null
    saving: boolean
    onOpenChange: (open: boolean) => void
    onSchedule: (prayerId: number, date: string) => Promise<void>
}) {
    const today = new Date().toISOString().slice(0, 10)
    const [date, setDate] = useState(today)
    const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)

    // Fresh state on every open: today as the date, the preset prayer (when
    // opened from a library row) or the first library entry otherwise.
    useEffect(() => {
        if (open) {
            setDate(today)
            setSelectedPrayerId(initialPrayerId ?? prayers[0]?.id ?? null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialPrayerId])

    // The library may still be loading when the dialog opens — pick the
    // first entry once it arrives (never overrides an explicit choice).
    useEffect(() => {
        if (open && !selectedPrayerId && prayers.length > 0) {
            setSelectedPrayerId(prayers[0].id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, prayers])

    const selected = prayers.find((p) => p.id === selectedPrayerId) ?? null
    // Scheduling is an upsert per date — warn when this replaces another override.
    const conflict = schedules.find(
        (s) => s.scheduledFor.slice(0, 10) === date && s.prayer.id !== selectedPrayerId,
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Schedule a Daily Prayer</DialogTitle>
                    <DialogDescription>
                        Set a specific prayer to be featured on a selected calendar date for all users.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Target Date *</label>
                        <Input
                            type="date"
                            value={date}
                            min={today}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {conflict && (
                        <ScheduleConflictWarning
                            message={`${conflict.prayer.reference} is already featured on ${formatScheduleDate(date)} — saving replaces it.`}
                        />
                    )}

                    {selected && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Selected Prayer</label>
                            <div className="rounded-lg border border-[#53624D]/40 bg-[#53624D]/5 p-2.5 text-xs">
                                <p className="font-semibold text-foreground">{selected.reference}</p>
                                <p className="line-clamp-2 italic text-muted-foreground mt-0.5">“{selected.verse}”</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Select Prayer from Library *</label>
                        <PrayerSelector
                            prayers={prayers}
                            selectedId={selectedPrayerId}
                            onSelect={setSelectedPrayerId}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (date && selectedPrayerId) {
                                onSchedule(selectedPrayerId, date)
                            }
                        }}
                        disabled={saving || !date || !selectedPrayerId}
                        className="bg-[#53624D] hover:bg-[#43503e] text-white"
                    >
                        {saving ? 'Scheduling...' : 'Schedule Prayer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/** Amber warning when the chosen date collides with another override. */
function ScheduleConflictWarning({ message }: { message: string }) {
    return (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
            {message}
        </p>
    )
}
