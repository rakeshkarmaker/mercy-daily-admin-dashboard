import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckSquare, Eye, HandHeart, Pencil, Plus, Quote, Trash2 } from 'lucide-react'
import type { Prayer, PrayerInput, PrayerSchedule } from '@/api/dailyprayers'

export interface PrayerManagementUIProps {
    prayers: Prayer[]
    schedules: PrayerSchedule[]
    totalPrayers: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onCreatePrayer: (input: PrayerInput) => Promise<void>
    onUpdatePrayer: (id: number, input: Partial<PrayerInput>) => Promise<void>
    onDeletePrayer: (id: number) => Promise<void>
    onSchedulePrayer: (id: number, scheduledFor: string) => Promise<void>
}

type FormState = PrayerInput
type ContentLanguage = 'en' | 'es' | 'pt'

const CONTENT_LANGUAGES: { value: ContentLanguage; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
]

const emptyForm: FormState = {
    verse: '',
    reference: '',
    reflection: '',
    prayer: '',
    practice: '',
}

const createEmptyLanguageForms = (): Record<ContentLanguage, FormState> => ({
    en: { ...emptyForm },
    es: { ...emptyForm },
    pt: { ...emptyForm },
})

export function PrayerManagementUI({
    prayers,
    schedules,
    totalPrayers,
    loading = false,
    page,
    limit,
    searchQuery,
    onSearchChange,
    onResetSearch,
    onCreatePrayer,
    onUpdatePrayer,
    onDeletePrayer,
    onSchedulePrayer,
}: PrayerManagementUIProps) {
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Prayer | null>(null)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [languageForms, setLanguageForms] = useState<Record<ContentLanguage, FormState>>(createEmptyLanguageForms)
    const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>('en')
    const [viewing, setViewing] = useState<Prayer | null>(null)
    const [deleting, setDeleting] = useState<Prayer | null>(null)
    const [scheduling, setScheduling] = useState<Prayer | null>(null)
    const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().slice(0, 10))
    const [saving, setSaving] = useState(false)

    const openCreate = () => {
        setEditing(null)
        setForm(emptyForm)
        setLanguageForms(createEmptyLanguageForms())
        setActiveLanguage('en')
        setFormOpen(true)
    }

    const openEdit = (prayer: Prayer) => {
        setEditing(prayer)
        setActiveLanguage('en')
        setForm({
            verse: prayer.verse,
            reference: prayer.reference,
            reflection: prayer.reflection,
            prayer: prayer.prayer,
            practice: prayer.practice ?? '',
        })
        setFormOpen(true)
    }

    const submitForm = async () => {
        const values = editing ? form : languageForms[activeLanguage]
        if (!values.verse.trim() || !values.reference.trim() || !values.prayer.trim()) return
        setSaving(true)
        try {
            if (editing) await onUpdatePrayer(editing.id, values)
            else await onCreatePrayer(values)
            setFormOpen(false)
        } finally {
            setSaving(false)
        }
    }

    const scheduleColumns = useMemo<DataTableColumn<PrayerSchedule>[]>(
        () => [
            { key: 'scheduledFor', header: 'SCHEDULED DATE', render: (row) => <span className="font-semibold text-foreground">{new Date(row.scheduledFor).toLocaleDateString()}</span> },
            { key: 'reference', header: 'REFERENCE', render: (row) => <span className="text-muted-foreground">{row.prayer.reference}</span> },
            { key: 'verse', header: 'VERSE', render: (row) => <span className="line-clamp-2 max-w-90 text-muted-foreground">{row.prayer.verse}</span> },
            { key: 'action', header: 'ACTION', render: (row) => <ActionButton label="View" onClick={() => setViewing(row.prayer)}><Eye /></ActionButton> },
        ],
        [],
    )

    const columns = useMemo<DataTableColumn<Prayer>[]>(
        () => [
            {
                key: 'verse',
                header: 'VERSE',
                render: (row) => <span className="font-semibold text-foreground line-clamp-2 max-w-70">{row.verse}</span>,
            },
            { key: 'reference', header: 'REFERENCE', render: (row) => <span className="text-muted-foreground">{row.reference}</span> },
            {
                key: 'prayer',
                header: 'PRAYER',
                render: (row) => <span className="text-muted-foreground line-clamp-2 max-w-90">{row.prayer}</span>,
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
                        <ActionButton label="View" onClick={() => setViewing(row)}><Eye /></ActionButton>
                        <ActionButton label="Edit" onClick={() => openEdit(row)}><Pencil /></ActionButton>
                        <ActionButton label="Today" onClick={() => onSchedulePrayer(row.id, new Date().toISOString().slice(0, 10))} className="text-success hover:bg-success/10"><CheckSquare /></ActionButton>
                        <ActionButton label="Schedule" onClick={() => { setScheduling(row); setScheduledFor(new Date().toISOString().slice(0, 10)) }} className="text-info hover:bg-info/10"><Calendar /></ActionButton>
                        <ActionButton label="Delete" onClick={() => setDeleting(row)} className="text-destructive hover:bg-destructive/10"><Trash2 /></ActionButton>
                    </div>
                ),
            },
        ],
        [onSchedulePrayer],
    )

    return (
        <div className="flex w-full max-w-full flex-col gap-4">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader title="Daily Prayers" description="Manage the prayer library and scheduled daily overrides." />
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search prayers..." className="w-full sm:w-64" />
                    <Button onClick={openCreate}><Plus className="mr-2 size-4" />Add prayer</Button>
                </div>
            </div>

            <Tabs defaultValue="library" className="w-full">
                <TabsList variant="line" className="mb-3 w-full justify-start border-b border-border/50">
                    <TabsTrigger value="library" className="flex-none px-4">Prayer library</TabsTrigger>
                    <TabsTrigger value="schedules" className="flex-none px-4">Schedules <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{schedules.length}</span></TabsTrigger>
                </TabsList>
                <TabsContent value="library">
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
                <TabsContent value="schedules">
                    <DataTable columns={scheduleColumns} data={schedules} total={schedules.length} page={1} limit={schedules.length || 1} noun="scheduled prayers" emptyIcon={<Calendar className="size-6" />} />
                </TabsContent>
            </Tabs>

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
                onLanguageFormChange={(language, nextForm) => setLanguageForms((previous) => ({ ...previous, [language]: nextForm }))}
                onSubmit={submitForm}
            />

            <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    {viewing && <>
                        <DialogHeader className="border-b border-dialog-border pb-4">
                            <div className="flex items-start gap-3 pr-6">
                                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Quote className="size-5" /></div>
                                <div className="min-w-0 space-y-1">
                                    <DialogTitle className="text-xl">{viewing.reference}</DialogTitle>
                                    <DialogDescription>Prayer #{viewing.id} · Created {new Date(viewing.createdAt).toLocaleDateString()} · Updated {new Date(viewing.updatedAt).toLocaleDateString()}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="space-y-5 py-1">
                            <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                                <p className="text-lg font-medium leading-relaxed text-foreground">“{viewing.verse}”</p>
                                <p className="mt-3 text-sm font-semibold text-primary">{viewing.reference}</p>
                            </section>
                            <ContentBlock label="Reflection" value={viewing.reflection} />
                            <ContentBlock label="Prayer" value={viewing.prayer} />
                            <ContentBlock label="Practice" value={viewing.practice ?? 'No practice specified'} />
                        </div>
                        <DialogFooter className="border-dialog-border">
                            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                            <Button onClick={() => { openEdit(viewing); setViewing(null) }}><Pencil className="mr-2 size-4" />Edit prayer</Button>
                        </DialogFooter>
                    </>}
                </DialogContent>
            </Dialog>

            <Dialog open={scheduling !== null} onOpenChange={(open) => !open && setScheduling(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule prayer</DialogTitle>
                        <DialogDescription>This date uses the selected prayer instead of the serial rotation.</DialogDescription>
                    </DialogHeader>
                    <Input type="date" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setScheduling(null)}>Cancel</Button>
                        <Button disabled={!scheduledFor || saving} onClick={async () => {
                            if (!scheduling) return
                            setSaving(true)
                            try { await onSchedulePrayer(scheduling.id, scheduledFor); setScheduling(null) } finally { setSaving(false) }
                        }}>Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TrashConfirm
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                name={deleting?.reference ?? 'this prayer'}
                onConfirm={async () => {
                    if (deleting) await onDeletePrayer(deleting.id)
                    setDeleting(null)
                }}
            />
        </div>
    )
}

function ActionButton({ label, onClick, children, className = 'text-primary hover:bg-primary/10' }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
    return <button type="button" title={label} aria-label={label} onClick={onClick} className={`rounded-full p-2 transition-colors ${className}`}>{children && <span className="size-4 [&>svg]:size-4">{children}</span>}</button>
}

function ContentBlock({ label, value }: { label: string; value: string }) {
    return <div className="space-y-1"><h4 className="font-semibold text-foreground">{label}</h4><p className="whitespace-pre-wrap rounded-lg border border-dialog-border bg-dialog-bg/60 p-3 text-muted-foreground">{value}</p></div>
}

function PrayerFormDialog({ open, editing, form, languageForms, activeLanguage, saving, onOpenChange, onChange, onLanguageChange, onLanguageFormChange, onSubmit }: {
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
    const renderFields = (values: FormState, update: (form: FormState) => void) => {
        const field = (key: keyof FormState, label: string, multiline = false) => multiline
            ? <Textarea value={values[key] ?? ''} onChange={(event) => update({ ...values, [key]: event.target.value })} placeholder={label} aria-label={label} />
            : <Input value={values[key] ?? ''} onChange={(event) => update({ ...values, [key]: event.target.value })} placeholder={label} aria-label={label} />

        return <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium">Verse{field('verse', 'Enter verse')}</label>
            <label className="grid gap-1.5 text-sm font-medium">Reference{field('reference', 'Enter scripture reference')}</label>
            <label className="grid gap-1.5 text-sm font-medium">Reflection{field('reflection', 'Enter reflection', true)}</label>
            <label className="grid gap-1.5 text-sm font-medium">Prayer{field('prayer', 'Enter prayer', true)}</label>
            <label className="grid gap-1.5 text-sm font-medium">Practice{field('practice', 'Optional practice', true)}</label>
        </div>
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editing ? 'Edit prayer' : 'Add prayer'}</DialogTitle>
                <DialogDescription>{editing ? 'Update the selected daily prayer.' : 'Translation saving is not connected yet. Create submits the selected language only.'}</DialogDescription>
            </DialogHeader>
            {editing ? renderFields(form, onChange) : <Tabs value={activeLanguage} onValueChange={(value) => onLanguageChange(value as ContentLanguage)} className="gap-3">
                <TabsList className="grid h-10 w-full grid-cols-3">
                    {CONTENT_LANGUAGES.map((language) => <TabsTrigger key={language.value} value={language.value}>{language.label}</TabsTrigger>)}
                </TabsList>
                {CONTENT_LANGUAGES.map((language) => <TabsContent key={language.value} value={language.value}>{renderFields(languageForms[language.value], (nextForm) => onLanguageFormChange(language.value, nextForm))}</TabsContent>)}
            </Tabs>}
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button disabled={saving || !(editing ? form : languageForms[activeLanguage]).verse.trim() || !(editing ? form : languageForms[activeLanguage]).reference.trim() || !(editing ? form : languageForms[activeLanguage]).prayer.trim()} onClick={onSubmit}>{editing ? 'Save changes' : 'Create prayer'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}
