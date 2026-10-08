import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import { ImageUpload } from '@/components/shared/image-upload'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Languages, Pencil, Plus, ThumbsUp, Trash2, Youtube, Languages as LanguagesIcon } from 'lucide-react'
import { toast } from 'sonner'
import { resolveImage } from '@/api/base'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterOption, FilterState } from '@/components/shared/filter-builder'
import { CONTENT_LANGUAGES, LANGUAGE_FILTER_OPTIONS } from '@/lib/language'
import type { Sermon, SermonInput, SermonLanguage, SermonStatus, SermonTranslationInput } from '@/api/sermons'

type StatusFilter = SermonStatus | 'ALL'

export interface SermonsUIProps {
    sermons: Sermon[]
    totalSermons: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    status: StatusFilter
    /** FilterBuilder state — the `language` select drives `?language=`. Omit = all languages. */
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onStatusChange: (value: StatusFilter) => void
    onCreateSermon: (input: SermonInput) => Promise<void>
    onUpdateSermon: (id: string, input: Partial<SermonInput>) => Promise<void>
    onDeleteSermon: (id: string) => Promise<void>
}

/** Per-language content fields (shared fields like status live outside). */
type LanguageFormState = {
    title: string
    overview: string
    thumbnailUrl: string
    youtubeUrl: string
}

type LanguageForms = Record<SermonLanguage, LanguageFormState>



const emptyLanguageForm = (): LanguageFormState => ({ title: '', overview: '', thumbnailUrl: '', youtubeUrl: '' })

const createEmptyLanguageForms = (): LanguageForms => ({
    en: emptyLanguageForm(),
    esp: emptyLanguageForm(),
    por: emptyLanguageForm(),
})

const ORDERED_LANGUAGES = ['en', 'esp', 'por'] as const

/**
 * Which tab holds the top-level fields: the stored base language while it
 * still has a title, otherwise the first filled tab. No picker needed —
 * filling any language just works.
 */
function resolveBase(forms: LanguageForms, storedBase?: SermonLanguage): SermonLanguage | undefined {
    if (storedBase && forms[storedBase].title.trim()) return storedBase
    return ORDERED_LANGUAGES.find((l) => forms[l].title.trim())
}

/**
 * Forms from an existing sermon: the top-level fields edit the sermon's
 * own (original) language tab; every stored translation fills its tab.
 */
const languageFormsFromSermon = (sermon: Sermon): LanguageForms => {
    const forms = createEmptyLanguageForms()
    const base = sermon.language ?? 'en'
    forms[base] = {
        title: sermon.title,
        overview: sermon.overview ?? '',
        thumbnailUrl: sermon.thumbnailUrl ?? '',
        youtubeUrl: sermon.youtubeUrl ?? '',
    }
    for (const t of sermon.translations) {
        if (t.language === base) continue
        forms[t.language] = {
            title: t.title,
            overview: t.overview ?? '',
            thumbnailUrl: t.thumbnailUrl ?? '',
            youtubeUrl: t.youtubeUrl ?? '',
        }
    }
    return forms
}

const STATUS_BADGE: Record<SermonStatus, string> = {
    PUBLISHED: 'bg-success/10 text-success',
    DRAFT: 'bg-primary/10 text-primary',
    ARCHIVED: 'bg-muted text-muted-foreground',
}

export function SermonsUI({
    sermons,
    totalSermons,
    loading = false,
    page,
    limit,
    searchQuery,
    status,
    filters,
    onFiltersChange,
    onSearchChange,
    onResetSearch,
    onStatusChange,
    onCreateSermon,
    onUpdateSermon,
    onDeleteSermon,
}: SermonsUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Sermon | null>(null)
    const [languageForms, setLanguageForms] = useState<LanguageForms>(createEmptyLanguageForms)
    const [sharedStatus, setSharedStatus] = useState<SermonStatus>('PUBLISHED')
    const [activeLanguage, setActiveLanguage] = useState<SermonLanguage>('en')
    const [viewing, setViewing] = useState<Sermon | null>(null)
    const [deleting, setDeleting] = useState<Sermon | null>(null)
    const [saving, setSaving] = useState(false)

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'language',
                label: 'Language',
                icon: LanguagesIcon,
                type: 'select',
                options: LANGUAGE_FILTER_OPTIONS,
            },
        ],
        [],
    )

    const openCreate = () => {
        setEditing(null)
        setLanguageForms(createEmptyLanguageForms())
        setSharedStatus('PUBLISHED')
        setActiveLanguage('en')
        setFormOpen(true)
    }

    const openEdit = (sermon: Sermon) => {
        setEditing(sermon)
        setLanguageForms(languageFormsFromSermon(sermon))
        setSharedStatus(sermon.status)
        setActiveLanguage(sermon.language ?? 'en')
        setFormOpen(true)
    }

    const submitForm = async () => {
        // First filled tab wins — no picker needed. Empty tabs are ignored
        // on create and remove that translation on edit.
        const base = resolveBase(languageForms, editing ? (editing.language ?? 'en') : undefined)
        if (!base) return
        const baseForm = languageForms[base]
        if (!baseForm.title.trim() || !baseForm.youtubeUrl.trim()) {
            toast.error('Title and YouTube link are required in at least one language.')
            return
        }

        const translations: SermonTranslationInput[] = []
        for (const language of ORDERED_LANGUAGES) {
            if (language === base) continue
            const form = languageForms[language]
            if (form.title.trim()) {
                translations.push({
                    language,
                    title: form.title.trim(),
                    overview: form.overview.trim() || undefined,
                    thumbnailUrl: form.thumbnailUrl.trim() || undefined,
                    youtubeUrl: form.youtubeUrl.trim() || undefined,
                })
            } else if (editing) {
                translations.push({ language })
            }
        }

        const input: SermonInput = {
            language: base,
            title: baseForm.title.trim(),
            overview: baseForm.overview.trim() || undefined,
            thumbnailUrl: baseForm.thumbnailUrl.trim() || undefined,
            youtubeUrl: baseForm.youtubeUrl.trim(),
            status: sharedStatus,
            translations,
        }

        setSaving(true)
        try {
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
                // resolveImage falls back to /placeholder.jpg when absent.
                render: (row) => (
                    <img
                        src={resolveImage(row.thumbnailUrl)}
                        alt={row.title}
                        className="h-10 w-16 rounded-md border border-border/50 object-cover"
                    />
                ),
            },
            {
                key: 'title',
                header: 'TITLE',
                render: (row) => (
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="line-clamp-2 max-w-72 font-semibold text-foreground">{row.title}</span>
                        <span className="flex flex-none items-center gap-0.5" title={`Languages: ${languageLabelsFor(row)}`}>
                            {CONTENT_LANGUAGES.map((l) => (
                                <LanguageDot key={l.value} language={l.value} available={hasLanguage(row, l.value)} />
                            ))}
                        </span>
                    </div>
                ),
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
                <PageHeader title="Sermons" description="Publish video sermons in English, Spanish and Portuguese, manage drafts and review engagement." />
                <div className="flex flex-wrap items-center gap-3">
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
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
                <TabsList variant="line" className="mb-3 w-full max-w-full justify-start overflow-x-auto border-b border-border/50">
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
                languageForms={languageForms}
                activeLanguage={activeLanguage}
                sharedStatus={sharedStatus}
                saving={saving}
                onOpenChange={setFormOpen}
                onLanguageChange={setActiveLanguage}
                onLanguageFormChange={(language, nextForm) => setLanguageForms((previous) => ({ ...previous, [language]: nextForm }))}
                onSharedStatusChange={setSharedStatus}
                onSubmit={submitForm}
            />

            <SermonViewDialog viewing={viewing} onOpenChange={(open) => !open && setViewing(null)} onEdit={(sermon) => {
                openEdit(sermon)
                setViewing(null)
            }} />

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

/** True when the sermon actually has content in that language. */
function hasLanguage(sermon: Sermon, language: SermonLanguage): boolean {
    if ((sermon.language ?? 'en') === language) return true
    return sermon.translations.some((t) => t.language === language)
}

function languageLabelsFor(sermon: Sermon): string {
    return CONTENT_LANGUAGES.filter((l) => hasLanguage(sermon, l.value))
        .map((l) => l.native)
        .join(', ')
}

/** Small language availability dot for the title cell. */
function LanguageDot({ language, available }: { language: SermonLanguage; available: boolean }) {
    const label = CONTENT_LANGUAGES.find((l) => l.value === language)?.label ?? language
    return (
        <span
            className={`rounded px-1 py-px text-[10px] font-semibold tracking-wide ${
                available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/50 line-through'
            }`}
        >
            {label}
        </span>
    )
}

/**
 * Per-language content fields. Shared fields (status) are rendered by the
 * caller; everything inside this block belongs to the active tab's language.
 */
function LanguageFields({
    values,
    disabled,
    onChange,
}: {
    values: LanguageFormState
    disabled?: boolean
    onChange: (form: LanguageFormState) => void
}) {
    const set = (key: keyof LanguageFormState, value: string) => onChange({ ...values, [key]: value })

    return (
        <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">
                Title
                <Input
                    value={values.title}
                    onChange={(event) => set('title', event.target.value)}
                    placeholder="The Power of Stillness"
                    aria-label="Title"
                />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
                Overview
                <Textarea value={values.overview} onChange={(event) => set('overview', event.target.value)} placeholder="What is this sermon about?" aria-label="Overview" />
            </label>
            <div className="grid gap-1.5 text-sm font-medium">
                <span>Thumbnail</span>
                <ThumbnailField value={values.thumbnailUrl} disabled={disabled} onChange={(url) => set('thumbnailUrl', url)} />
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
                YouTube link
                <Input value={values.youtubeUrl} onChange={(event) => set('youtubeUrl', event.target.value)} placeholder="https://www.youtube.com/watch?v=..." aria-label="YouTube link" />
            </label>
        </div>
    )
}

function SermonFormDialog({
    open,
    editing,
    languageForms,
    activeLanguage,
    sharedStatus,
    saving,
    onOpenChange,
    onLanguageChange,
    onLanguageFormChange,
    onSharedStatusChange,
    onSubmit,
}: {
    open: boolean
    editing: Sermon | null
    languageForms: LanguageForms
    activeLanguage: SermonLanguage
    sharedStatus: SermonStatus
    saving: boolean
    onOpenChange: (open: boolean) => void
    onLanguageChange: (language: SermonLanguage) => void
    onLanguageFormChange: (language: SermonLanguage, form: LanguageFormState) => void
    onSharedStatusChange: (status: SermonStatus) => void
    onSubmit: () => Promise<void>
}) {
    const base = resolveBase(languageForms, editing ? (editing.language ?? 'en') : undefined)
    const canSubmit = Boolean(
        base && languageForms[base].title.trim() && languageForms[base].youtubeUrl.trim(),
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit sermon' : 'Add sermon'}</DialogTitle>
                    <DialogDescription>
                        Fill any language tab — the first filled tab becomes the sermon. Empty tabs are ignored.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <label className="grid max-w-xs gap-1.5 text-sm font-medium">
                        Status
                        <Select value={sharedStatus} onValueChange={(value) => onSharedStatusChange(value as SermonStatus)}>
                            <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PUBLISHED">Published</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </label>

                    <Tabs value={activeLanguage} onValueChange={(value) => onLanguageChange(value as SermonLanguage)} className="gap-3">
                        <TabsList className="grid h-10 w-full grid-cols-3">
                            {CONTENT_LANGUAGES.map((language) => (
                                <TabsTrigger key={language.value} value={language.value}>
                                    {language.label}
                                    {languageForms[language.value].title.trim() && (
                                        <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary" aria-hidden />
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {CONTENT_LANGUAGES.map((language) => (
                            <TabsContent key={language.value} value={language.value}>
                                <LanguageFields
                                    values={languageForms[language.value]}
                                    disabled={saving}
                                    onChange={(nextForm) => onLanguageFormChange(language.value, nextForm)}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button disabled={saving || !canSubmit} onClick={onSubmit}>
                        {editing ? 'Save changes' : 'Create sermon'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/** Content of one language inside the view dialog (falls back to the original fields). */
function ViewLanguageContent({ sermon, language }: { sermon: Sermon; language: SermonLanguage }) {
    const base = sermon.language ?? 'en'
    const baseLabel = CONTENT_LANGUAGES.find((l) => l.value === base)?.label ?? base
    const translation = sermon.translations.find((t) => t.language === language)
    const exists = language === base || Boolean(translation)

    const title = language === base ? sermon.title : (translation?.title ?? sermon.title)
    const overview = language === base ? sermon.overview : (translation?.overview ?? sermon.overview)
    const thumbnailUrl = language === base ? sermon.thumbnailUrl : (translation?.thumbnailUrl ?? sermon.thumbnailUrl)
    const youtubeUrl = language === base ? sermon.youtubeUrl : (translation?.youtubeUrl ?? sermon.youtubeUrl)
    const topics = translation?.topics ?? sermon.topics

    return (
        <div className="space-y-4">
            {!exists && (
                <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    <Languages className="size-3.5" />
                    Not translated yet — showing the {baseLabel} content as fallback.
                </p>
            )}
            {title && <h4 className="text-base font-semibold text-foreground">{title}</h4>}
            <img src={resolveImage(thumbnailUrl)} alt={title || 'Sermon thumbnail'} className="aspect-video w-full rounded-xl border border-border/50 object-cover" />
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{overview || 'No overview yet.'}</p>
            </section>
            {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                        <Badge key={topic.id} variant="secondary">
                            #{topic.slug}
                        </Badge>
                    ))}
                </div>
            )}
            {youtubeUrl && (
                <Button variant="outline" asChild>
                    <a href={youtubeUrl} target="_blank" rel="noreferrer">
                        <Youtube className="mr-2 size-4" />
                        Open on YouTube
                    </a>
                </Button>
            )}
        </div>
    )
}

function SermonViewDialog({
    viewing,
    onOpenChange,
    onEdit,
}: {
    viewing: Sermon | null
    onOpenChange: (open: boolean) => void
    onEdit: (sermon: Sermon) => void
}) {
    return (
        <Dialog open={viewing !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                        <div className="space-y-4 py-1">
                            {/* Language sub-tabs: per-language content, EN first. */}
                            <Tabs defaultValue="en" className="gap-3">
                                <TabsList className="grid h-10 w-full grid-cols-3">
                                    {CONTENT_LANGUAGES.map((language) => (
                                        <TabsTrigger key={language.value} value={language.value}>
                                            {language.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {CONTENT_LANGUAGES.map((language) => (
                                    <TabsContent key={language.value} value={language.value}>
                                        <ViewLanguageContent sermon={viewing} language={language.value} />
                                    </TabsContent>
                                ))}
                            </Tabs>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Metric label="Views" value={viewing.viewsCount} />
                                <Metric label="Likes" value={viewing.likesCount} />
                                <Metric label="Comments" value={viewing.commentsCount} />
                                <Metric label="Shares" value={viewing.sharesCount} />
                            </div>
                        </div>
                        <DialogFooter className="border-dialog-border">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    onEdit(viewing)
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

/**
 * Thumbnail picker for the sermon form (folder=sermons), backed by the
 * shared controlled ImageUpload.
 */
function ThumbnailField({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (url: string) => void }) {
    return (
        <ImageUpload
            value={value}
            onChange={onChange}
            folder="sermons"
            disabled={disabled}
            label="Upload thumbnail (PNG, JPG, WEBP)"
            alt="Sermon thumbnail"
        />
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
