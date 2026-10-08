import { useMemo, useState, useRef, useEffect } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { resolveImage } from '@/api'
import { CONTENT_LANGUAGES, LANGUAGE_FILTER_OPTIONS } from '@/lib/language'
import type { ContentLanguage } from '@/lib/language'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterOption, FilterState } from '@/components/shared/filter-builder'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ImageUpload } from '@/components/shared/image-upload'
import {
    Activity,
    Check,
    CheckCircle2,
    Calendar,
    ChevronsUpDown,
    Clock,
    ImagePlus,
    Languages,
    ListMusic,
    Music,
    Pause,
    Pencil,
    Play,
    Plus,
    SkipBack,
    SkipForward,
    Sparkles,
    Trash2,
    Volume2,
    X,
    BookOpen,
} from 'lucide-react'
import type {
    PlaylistInput,
    PlaylistTranslationInput,
    SongInput,
    SongTranslationInput,
    WorshipPlaylist,
    WorshipSong,
    WorshipStats,
} from '@/api/worship-music'
import type { WorshipSongStatus } from '@/types/worship-music'

export interface WorshipMusicUIProps {
    songs: WorshipSong[]
    stats: WorshipStats
    songsLoading?: boolean
    page: number
    limit: number
    /** FilterBuilder state — `language` drives `?language=`, `status` the songs query. Omit = all. */
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    playlists: WorshipPlaylist[]
    searchQuery: string
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onCreateSong: (input: SongInput) => Promise<void>
    onUpdateSong: (id: string, input: Partial<SongInput>) => Promise<void>
    onDeleteSong: (id: string) => Promise<void>
    onRecordPlay: (id: string) => void
    onCreatePlaylist: (input: PlaylistInput) => Promise<void>
    onUpdatePlaylist: (id: string, input: Partial<PlaylistInput>) => Promise<void>
    onDeletePlaylist: (id: string) => Promise<void>
}

/** Per-language content: the fields a translator actually rewrites. */
type LanguageFormState = {
    title: string
    description: string
    bibleReference: string
}

type LanguageForms = Record<ContentLanguage, LanguageFormState>

const emptyLanguageForm = (): LanguageFormState => ({
    title: '',
    description: '',
    bibleReference: '',
})

/**
 * Language blocks for a new/existing entity. The original language lives
 * in the base columns; the other languages are optional and fall back to
 * it per field when empty.
 */
const createEmptyLanguageForms = (): LanguageForms => ({
    en: emptyLanguageForm(),
    esp: emptyLanguageForm(),
    por: emptyLanguageForm(),
})

const ORDERED_LANGUAGES = ['en', 'esp', 'por'] as const

/** First filled tab wins — no picker needed. Empty tabs are ignored. */
function resolveBase(forms: LanguageForms, storedBase?: ContentLanguage): ContentLanguage | undefined {
    if (storedBase && forms[storedBase].title.trim()) return storedBase
    return ORDERED_LANGUAGES.find((l) => forms[l].title.trim())
}

type SongFormState = {
    artist: string
    /** Duration in decimal minutes (e.g. 4.5). Sent as whole seconds. */
    durationMinutes: string
    audioUrl: string
    coverUrl: string
    playlistId: string
    status: WorshipSongStatus
    isFeatured: boolean
}

const emptySongForm: SongFormState = {
    artist: 'Mercy Daily Worship',
    durationMinutes: '',
    audioUrl: '',
    coverUrl: '',
    playlistId: '',
    status: 'PUBLISHED',
    isFeatured: false,
}

/** Language blocks from an existing song (top-level fields = its own language). */
const songLanguageForms = (song: WorshipSong): LanguageForms => {
    const forms = createEmptyLanguageForms()
    const base = song.language ?? 'en'
    forms[base] = {
        title: song.title,
        description: song.description ?? '',
        bibleReference: song.bibleReference ?? '',
    }
    for (const t of song.translations) {
        if (t.language === base) continue
        forms[t.language] = {
            title: t.title,
            description: t.description ?? '',
            bibleReference: t.bibleReference ?? '',
        }
    }
    return forms
}

/**
 * Sync blocks for the languages other than the base one. A block with a
 * title upserts that language; an empty title on update removes the
 * stored translation.
 */
function toSongTranslations(
    forms: LanguageForms,
    baseLanguage: ContentLanguage,
    editing: boolean,
): SongTranslationInput[] {
    const items: SongTranslationInput[] = []
    for (const language of ['en', 'esp', 'por'] as const) {
        if (language === baseLanguage) continue
        const form = forms[language]
        if (form.title.trim()) {
            items.push({
                language,
                title: form.title.trim(),
                description: form.description.trim() || null,
                bibleReference: form.bibleReference.trim() || null,
            })
        } else if (editing) {
            items.push({ language })
        }
    }
    return items
}

/** Decimal minutes (4.5) → whole seconds (270). */
function minutesToSeconds(value: string): number {
    const minutes = Number.parseFloat(value)
    if (!Number.isFinite(minutes) || minutes < 0) return 0
    return Math.round(minutes * 60)
}

/** Stored seconds (270) → decimal minutes input value (4.5). */
function secondsToMinutes(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return ''
    return String(Math.round((totalSeconds / 60) * 100) / 100)
}

/** Language blocks for a playlist (top-level fields = its own language). */
const playlistLanguageForms = (playlist: WorshipPlaylist): LanguageForms => {
    const forms = createEmptyLanguageForms()
    const base = playlist.language ?? 'en'
    forms[base] = {
        title: playlist.title,
        description: playlist.description ?? '',
        bibleReference: '',
    }
    for (const t of playlist.translations) {
        if (t.language === base) continue
        forms[t.language] = { title: t.title, description: t.description ?? '', bibleReference: '' }
    }
    return forms
}

type PlaylistFormState = PlaylistInput & { coverUrl: string; description: string; isFeatured: boolean }

/** True when the row actually carries content in that language. */
function hasSongLanguage(song: WorshipSong, language: ContentLanguage): boolean {
    if ((song.language ?? 'en') === language) return true
    return song.translations.some((t) => t.language === language)
}

function hasPlaylistLanguage(playlist: WorshipPlaylist, language: ContentLanguage): boolean {
    if ((playlist.language ?? 'en') === language) return true
    return playlist.translations.some((t) => t.language === language)
}

/** Language availability badge for title cells and cards. */
function LanguageDot({ language, available }: { language: ContentLanguage; available: boolean }) {
    const label = CONTENT_LANGUAGES.find((l) => l.value === language)?.label ?? language
    return (
        <Badge
            variant={available ? 'secondary' : 'outline'}
            className={available ? undefined : 'text-muted-foreground/50 line-through'}
        >
            {label}
        </Badge>
    )
}

/** Playlist sync blocks for the languages other than the base one (empty title on update removes the row). */
function toPlaylistTranslations(
    forms: LanguageForms,
    baseLanguage: ContentLanguage,
    editing: boolean,
): PlaylistTranslationInput[] {
    const items: PlaylistTranslationInput[] = []
    for (const language of ['en', 'esp', 'por'] as const) {
        if (language === baseLanguage) continue
        const form = forms[language]
        if (form.title.trim()) {
            items.push({
                language,
                title: form.title.trim(),
                description: form.description.trim() || null,
            })
        } else if (editing) {
            items.push({ language })
        }
    }
    return items
}

/** A language tab strip shared by the song/playlist dialogs. Fill any tab. */
function LanguageTabs({
    value,
    forms,
    field2Label = 'Bible Reference',
    field3Label = 'Description',
    onChange,
    onFormChange,
}: {
    value: ContentLanguage
    forms: LanguageForms
    field2Label?: string | null
    field3Label?: string
    onChange: (language: ContentLanguage) => void
    onFormChange: (language: ContentLanguage, form: LanguageFormState) => void
}) {
    return (
        <Tabs value={value} onValueChange={(v) => onChange(v as ContentLanguage)} className="gap-3">
            <TabsList className="grid h-10 w-full grid-cols-3">
                {CONTENT_LANGUAGES.map((language) => (
                    <TabsTrigger key={language.value} value={language.value} className="gap-1.5">
                        {language.label}
                        {forms[language.value].title.trim() && (
                            <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
            {CONTENT_LANGUAGES.map((language) => {
                const form = forms[language.value]
                const set = (key: keyof LanguageFormState, next: string) =>
                    onFormChange(language.value, { ...form, [key]: next })
                return (
                    <TabsContent key={language.value} value={language.value} className="mt-0">
                        <div className="space-y-3">
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => set('title', e.target.value)}
                                    placeholder="e.g. Goodness of God"
                                    aria-label={`Title (${language.label})`}
                                />
                            </div>
                            {field2Label !== null && (
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">{field2Label}</Label>
                                    <Input
                                        value={form.bibleReference}
                                        onChange={(e) => set('bibleReference', e.target.value)}
                                        placeholder={field2Label === 'Button label' ? 'e.g. Play Now' : 'e.g. Psalm 23:6'}
                                        aria-label={`${field2Label} (${language.label})`}
                                    />
                                </div>
                            )}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">{field3Label}</Label>
                                <Textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder="Background or prayer focus..."
                                    aria-label={`${field3Label} (${language.label})`}
                                />
                            </div>
                        </div>
                    </TabsContent>
                )
            })}
        </Tabs>
    )
}

export function WorshipMusicUI({
    songs,
    stats,
    songsLoading = false,
    page,
    limit,
    filters,
    onFiltersChange,
    playlists,
    searchQuery,
    onSearchChange,
    onResetSearch,
    onCreateSong,
    onUpdateSong,
    onDeleteSong,
    onRecordPlay,
    onCreatePlaylist,
    onUpdatePlaylist,
    onDeletePlaylist,
}: WorshipMusicUIProps) {
    const [mainTab, setMainTab] = useState<'songs' | 'playlists'>('songs')

    // Modals
    const [songFormOpen, setSongFormOpen] = useState(false)
    const [editingSong, setEditingSong] = useState<WorshipSong | null>(null)
    const [songForm, setSongForm] = useState<SongFormState>(emptySongForm)
    const [songLangForms, setSongLangForms] = useState<LanguageForms>(createEmptyLanguageForms)
    const [songLang, setSongLang] = useState<ContentLanguage>('en')
    const [deletingSong, setDeletingSong] = useState<WorshipSong | null>(null)

    const [playlistFormOpen, setPlaylistFormOpen] = useState(false)
    const [editingPlaylist, setEditingPlaylist] = useState<WorshipPlaylist | null>(null)
    const [playlistForm, setPlaylistForm] = useState<PlaylistFormState>({
        title: '',
        description: '',
        coverUrl: '',
        isFeatured: true,
    })
    const [playlistLangForms, setPlaylistLangForms] = useState<LanguageForms>(createEmptyLanguageForms)
    const [playlistLang, setPlaylistLang] = useState<ContentLanguage>('en')
    const [deletingPlaylist, setDeletingPlaylist] = useState<WorshipPlaylist | null>(null)

    // Audio Playback Preview State (App replica!)
    const [currentPlaying, setCurrentPlaying] = useState<WorshipSong | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Filter songs by search (status is server-filtered via the query key)
    const filteredSongs = useMemo(() => {
        // Playlist is the category in music context.
        const playlistTitleById = new Map(playlists.map((p) => [p.id, p.title]))
        if (!searchQuery.trim()) return songs
        const q = searchQuery.toLowerCase()
        return songs.filter((s) =>
            [
                s.title,
                s.artist,
                s.bibleReference ?? '',
                s.description ?? '',
                s.playlist?.title ?? playlistTitleById.get(s.playlist?.id ?? '') ?? '',
            ].some((value) => value.toLowerCase().includes(q)),
        )
    }, [songs, playlists, searchQuery])

    // Stat Cards (library-wide totals from the server)

    // const statCards = useMemo<StatCardProps[]>(
    //     () => [
    //         {
    //             label: 'Total Worship Songs',
    //             value: stats.totalSongs,
    //             icon: Music,
    //             color: 'emerald',
    //         },
    //         {
    //             label: 'Worship Playlists',
    //             value: stats.totalPlaylists,
    //             icon: ListMusic,
    //             color: 'blue',
    //         },
    //         {
    //             label: 'Featured Songs',
    //             value: stats.featuredCount,
    //             icon: Sparkles,
    //             color: 'amber',
    //         },
    //         {
    //             label: 'Total Streams / Plays',
    //             value: stats.totalPlays.toLocaleString(),
    //             icon: Headphones,
    //             color: 'pink',
    //         },
    //     ],
    //     [stats],
    // )

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'language',
                label: 'Language',
                icon: Languages,
                type: 'select',
                options: LANGUAGE_FILTER_OPTIONS,
            },
            // Status applies to the songs library query only; playlists ignore it.
            {
                id: 'status',
                label: 'Status',
                icon: Activity,
                type: 'select',
                options: [
                    { label: 'Published', value: 'PUBLISHED' },
                    { label: 'Scheduled', value: 'SCHEDULED' },
                    { label: 'Draft', value: 'DRAFT' },
                ],
            },
        ],
        [],
    )

    const openCreateSong = () => {
        setEditingSong(null)
        setSongForm({ ...emptySongForm, playlistId: playlists[0]?.id ?? '' })
        setSongLangForms(createEmptyLanguageForms())
        setSongLang('en')
        setSongFormOpen(true)
    }

    const openEditSong = (song: WorshipSong) => {
        const base = song.language ?? 'en'
        setEditingSong(song)
        setSongForm({
            artist: song.artist,
            durationMinutes: secondsToMinutes(song.durationSeconds),
            audioUrl: song.audioUrl ?? '',
            coverUrl: song.coverUrl ?? '',
            playlistId: song.playlist?.id ?? '',
            status: song.status,
            isFeatured: song.isFeatured,
        })
        setSongLangForms(songLanguageForms(song))
        setSongLang(base)
        setSongFormOpen(true)
    }

    const submitSongForm = async () => {
        const baseLang = resolveBase(songLangForms, editingSong ? (editingSong.language ?? 'en') : undefined)
        if (!baseLang) return
        const base = songLangForms[baseLang]
        if (!base.title.trim() || !songForm.artist.trim()) return

        const input: SongInput = {
            language: baseLang,
            title: base.title.trim(),
            artist: songForm.artist.trim() || undefined,
            durationSeconds: minutesToSeconds(songForm.durationMinutes),
            audioUrl: songForm.audioUrl.trim() || null,
            coverUrl: songForm.coverUrl.trim() || null,
            description: base.description.trim() || null,
            bibleReference: base.bibleReference.trim() || null,
            playlistId: songForm.playlistId || null,
            status: songForm.status,
            isFeatured: songForm.isFeatured,
            translations: {
                items: toSongTranslations(songLangForms, baseLang, Boolean(editingSong)),
            },
        }

        if (editingSong) await onUpdateSong(editingSong.id, input)
        else await onCreateSong(input)
        setSongFormOpen(false)
    }

    const toggleSongFeatured = (song: WorshipSong) => {
        onUpdateSong(song.id, { isFeatured: !song.isFeatured })
    }

    // Audio playback toggle (starting a new track counts a play)
    const handlePlaySong = (song: WorshipSong) => {
        if (currentPlaying?.id === song.id) {
            if (isPlaying) {
                audioRef.current?.pause()
                setIsPlaying(false)
            } else {
                audioRef.current?.play()
                setIsPlaying(true)
            }
        } else {
            setCurrentPlaying(song)
            setIsPlaying(true)
            onRecordPlay(song.id)
        }
    }

    useEffect(() => {
        if (currentPlaying && isPlaying) {
            audioRef.current?.play().catch(() => {})
        }
    }, [currentPlaying, isPlaying])

    // Table Columns matching Figma & App screenshot
    const songColumns = useMemo<DataTableColumn<WorshipSong>[]>(
        () => [
            {
                key: 'track',
                header: 'PRAYER / SONG TITLE',
                render: (row) => {
                    const isCurrent = currentPlaying?.id === row.id && isPlaying
                    return (
                        <div className="flex items-center gap-3 min-w-56">
                            <div className="relative size-10 rounded-lg overflow-hidden bg-muted shrink-0 group border border-border/50">
                                <img
                                    src={resolveImage(row.coverUrl)}
                                    alt={row.title}
                                    className="size-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handlePlaySong(row)}
                                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity cursor-pointer ${
                                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                >
                                    {isCurrent ? (
                                        <Pause className="size-4 text-white fill-white" />
                                    ) : (
                                        <Play className="size-4 text-white fill-white ml-0.5" />
                                    )}
                                </button>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground text-sm truncate flex items-center gap-1.5">
                                    {row.title}
                                    {row.isFeatured && (
                                        <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px] h-4 px-1.5">
                                            <Sparkles className="size-2.5 mr-0.5" /> Featured
                                        </Badge>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="size-3" /> {row.duration}
                                    <span className="flex items-center gap-0.5" title={`Languages: ${CONTENT_LANGUAGES.filter((l) => hasSongLanguage(row, l.value)).map((l) => l.native).join(', ')}`}>
                                        {CONTENT_LANGUAGES.map((l) => (
                                            <LanguageDot key={l.value} language={l.value} available={hasSongLanguage(row, l.value)} />
                                        ))}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                key: 'artist',
                header: 'AUTHOR / ARTIST',
                render: (row) => (
                    <span className="font-medium text-sm text-foreground whitespace-nowrap">
                        {row.artist}
                    </span>
                ),
            },
            {
                key: 'playlist',
                header: 'PLAYLIST',
                render: (row) => (
                    <Badge variant="outline" className="text-xs bg-muted/30">
                        {row.playlist?.title ?? '—'}
                    </Badge>
                ),
            },
            {
                key: 'bibleVerse',
                header: 'ASSIGNED BIBLE VERSE',
                render: (row) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-56 truncate">
                        <BookOpen className="size-3 shrink-0 text-primary" />
                        <span className="truncate">{row.bibleReference || '—'}</span>
                    </div>
                ),
            },
            {
                key: 'plays',
                header: 'PLAYS',
                render: (row) => (
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {(row.playsCount ?? 0).toLocaleString()}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => {
                    if (row.status === 'PUBLISHED') {
                        return (
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                                <CheckCircle2 className="size-3" /> Published
                            </Badge>
                        )
                    }
                    if (row.status === 'SCHEDULED') {
                        return (
                            <Badge variant="outline" className="text-info border-info/30 bg-info/10 gap-1">
                                <Calendar className="size-3" /> Scheduled
                            </Badge>
                        )
                    }
                    return (
                        <Badge variant="secondary" className="gap-1">
                            Draft
                        </Badge>
                    )
                },
            },
            {
                key: 'actions',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionButton
                            label={currentPlaying?.id === row.id && isPlaying ? 'Pause preview' : 'Play audio preview'}
                            onClick={() => handlePlaySong(row)}
                            className={
                                currentPlaying?.id === row.id && isPlaying
                                    ? 'text-primary bg-primary/10'
                                    : 'text-primary hover:bg-primary/10'
                            }
                        >
                            {currentPlaying?.id === row.id && isPlaying ? <Pause /> : <Play />}
                        </ActionButton>
                        <ActionButton
                            label={row.isFeatured ? 'Remove from Featured Music' : 'Pin to Featured Music'}
                            onClick={() => toggleSongFeatured(row)}
                            className={row.isFeatured ? 'text-warning hover:bg-warning/10' : 'text-muted-foreground hover:bg-muted'}
                        >
                            <Sparkles />
                        </ActionButton>
                        <ActionButton label="Edit song" onClick={() => openEditSong(row)}>
                            <Pencil />
                        </ActionButton>
                        <ActionButton
                            label="Delete song"
                            onClick={() => setDeletingSong(row)}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 />
                        </ActionButton>
                    </div>
                ),
            },
        ],
        [currentPlaying, isPlaying],
    )

    const openCreatePlaylist = () => {
        setEditingPlaylist(null)
        setPlaylistForm({
            title: '',
            description: '',
            coverUrl: '',
            isFeatured: true,
        })
        setPlaylistLangForms(createEmptyLanguageForms())
        setPlaylistLang('en')
        setPlaylistFormOpen(true)
    }

    return (
        <div className="flex w-full max-w-full flex-col gap-4 pb-24">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <PageHeader
                    title="Worship Music"
                    description="Manage praise and worship audio tracks and playlists on the mobile app."
                />
                <div className="flex flex-wrap items-center gap-3">
                    <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                    {mainTab === 'songs' && (
                        <SearchInput
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            placeholder="Search title, artist, verse..."
                            className="w-full sm:w-64"
                        />
                    )}
                    {mainTab === 'songs' ? (
                        <Button onClick={openCreateSong}>
                            <Plus className="mr-2 size-4" />
                            Add Music
                        </Button>
                    ) : (
                        <Button onClick={openCreatePlaylist}>
                            <Plus className="mr-2 size-4" />
                            Add Playlist
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full">
                <TabsList variant="line" className="mb-3 w-full max-w-full justify-start overflow-x-auto border-b border-border/50">
                    <TabsTrigger value="songs" className="flex-none gap-1.5 px-4">
                        <Music className="size-4" /> Songs Library
                    </TabsTrigger>
                    <TabsTrigger value="playlists" className="flex-none gap-1.5 px-4">
                        <ListMusic className="size-4" /> Featured Playlists
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Tab 1: Songs Table */}
            {mainTab === 'songs' && (
                <DataTable
                    columns={songColumns}
                    data={filteredSongs}
                    loading={songsLoading}
                    total={searchQuery.trim() ? filteredSongs.length : stats.totalSongs}
                    page={page}
                    limit={limit}
                    noun="worship tracks"
                    onReset={onResetSearch}
                    emptyIcon={<Music className="size-8 text-muted-foreground" />}
                />
            )}

            {/* Tab 2: Featured Playlists */}
            {mainTab === 'playlists' && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Featured Playlists</h3>
                        <p className="text-xs text-muted-foreground">
                            These playlists are displayed in the carousel on the mobile app home screen.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {playlists.map((pl) => (
                            <div
                                key={pl.id}
                                className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                                    <img src={resolveImage(pl.coverUrl)} alt={pl.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                        <h4 className="font-bold text-white text-base leading-tight drop-shadow-sm">
                                            {pl.title}
                                        </h4>
                                        <span className="text-xs text-white/80 font-medium">
                                            {pl.songCount} songs
                                        </span>
                                        <span className="mt-1 flex items-center gap-0.5">
                                            {CONTENT_LANGUAGES.map((l) => (
                                                <LanguageDot key={l.value} language={l.value} available={hasPlaylistLanguage(pl, l.value)} />
                                            ))}
                                        </span>
                                    </div>
                                    {pl.isFeatured && (
                                        <Badge className="absolute top-2.5 right-2.5 bg-warning text-warning-foreground font-semibold text-[10px] h-5 shadow">
                                            Featured
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {pl.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                        <span className="text-[11px] text-muted-foreground">
                                            {pl.songCount} {pl.songCount === 1 ? 'track' : 'tracks'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <ActionButton
                                                label="Edit playlist"
                                                onClick={() => {
                                                    const base = pl.language ?? 'en'
                                                    setEditingPlaylist(pl)
                                                    setPlaylistForm({
                                                        title: pl.title,
                                                        description: pl.description ?? '',
                                                        coverUrl: pl.coverUrl ?? '',
                                                        isFeatured: pl.isFeatured,
                                                    })
                                                    setPlaylistLangForms(playlistLanguageForms(pl))
                                                    setPlaylistLang(base)
                                                    setPlaylistFormOpen(true)
                                                }}
                                            >
                                                <Pencil />
                                            </ActionButton>
                                            <ActionButton
                                                label="Delete playlist"
                                                onClick={() => setDeletingPlaylist(pl)}
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 />
                                            </ActionButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create / Edit Song Dialog (Faithful to Figma & App) */}
            <Dialog open={songFormOpen} onOpenChange={setSongFormOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSong ? 'Edit Worship Music' : 'Add New Worship Music'}</DialogTitle>
                        <DialogDescription>
                            Fill any language tab — the first filled tab becomes the track. Empty tabs are ignored.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Per-language content */}
                        <div className="border-b pb-4">
                            <LanguageTabs
                                value={songLang}
                                forms={songLangForms}
                                onChange={setSongLang}
                                onFormChange={(lang, form) =>
                                    setSongLangForms({ ...songLangForms, [lang]: form })
                                }
                            />
                        </div>

                        {/* Shared track details */}
                        <div className="border-b pb-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Track Details (shared across languages)
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">
                                        Author / Artist <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        value={songForm.artist}
                                        onChange={(e) => setSongForm({ ...songForm, artist: e.target.value })}
                                        placeholder="e.g. Bethel Music"
                                        required
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={songForm.durationMinutes}
                                        onChange={(e) => setSongForm({ ...songForm, durationMinutes: e.target.value })}
                                        placeholder="e.g. 4.5"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Playlist (the category)</Label>
                                <SearchablePlaylistSelect
                                    playlists={playlists}
                                    value={songForm.playlistId}
                                    onChange={(playlistId) => setSongForm({ ...songForm, playlistId })}
                                />
                            </div>
                        </div>

                        {/* Cover Art Upload */}
                        <div className="border-b pb-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <ImagePlus className="size-3.5 text-primary" /> Cover Art
                            </h4>
                            <ImageUpload
                                value={songForm.coverUrl}
                                onChange={(coverUrl) => setSongForm({ ...songForm, coverUrl })}
                                folder="worship-music"
                            />
                        </div>

                        {/* Audio & Publishing */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Volume2 className="size-3.5 text-pink-500" /> Audio & Publishing
                            </h4>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Audio Stream URL (.mp3)</Label>
                                <Input
                                    value={songForm.audioUrl}
                                    onChange={(e) => setSongForm({ ...songForm, audioUrl: e.target.value })}
                                    placeholder="https://example.com/audio.mp3"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Publishing Status</Label>
                                    <Select
                                        value={songForm.status}
                                        onValueChange={(val) => setSongForm({ ...songForm, status: val as WorshipSongStatus })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PUBLISHED">Published</SelectItem>
                                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                            <SelectItem value="DRAFT">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                                    <div>
                                        <Label className="text-xs font-medium cursor-pointer">
                                            Pin in Featured Music
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground">
                                            Feature prominently on the mobile screen
                                        </p>
                                    </div>
                                    <Switch
                                        checked={songForm.isFeatured}
                                        onCheckedChange={(checked) => setSongForm({ ...songForm, isFeatured: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSongFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitSongForm}
                            disabled={!resolveBase(songLangForms, editingSong ? (editingSong.language ?? 'en') : undefined) || !songForm.artist.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {editingSong ? 'Save Changes' : 'Add Music Track'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Playlist Dialog */}
            <Dialog open={playlistFormOpen} onOpenChange={setPlaylistFormOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}</DialogTitle>
                        <DialogDescription>
                            Switch tabs to manage each language. The playlist is the category in music context.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <LanguageTabs
                            value={playlistLang}
                            forms={playlistLangForms}
                            field2Label={null}
                            onChange={setPlaylistLang}
                            onFormChange={(lang, form) =>
                                setPlaylistLangForms({ ...playlistLangForms, [lang]: form })
                            }
                        />
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Cover Image (shared)</Label>
                            <ImageUpload
                                value={playlistForm.coverUrl}
                                onChange={(coverUrl) => setPlaylistForm({ ...playlistForm, coverUrl })}
                                folder="worship-music"
                                compact
                            />
                        </div>
                        <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                            <div>
                                <Label className="text-xs font-medium">Feature in App Carousel</Label>
                                <p className="text-[11px] text-muted-foreground">Show in Featured Playlists</p>
                            </div>
                            <Switch
                                checked={playlistForm.isFeatured}
                                onCheckedChange={(checked) => setPlaylistForm({ ...playlistForm, isFeatured: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPlaylistFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                const baseLang = resolveBase(playlistLangForms, editingPlaylist ? (editingPlaylist.language ?? 'en') : undefined)
                                if (!baseLang) return
                                const base = playlistLangForms[baseLang]
                                const input: PlaylistInput = {
                                    language: baseLang,
                                    title: base.title.trim(),
                                    description: base.description.trim() || null,
                                    coverUrl: playlistForm.coverUrl.trim() || null,
                                    isFeatured: playlistForm.isFeatured,
                                    translations: {
                                        items: toPlaylistTranslations(playlistLangForms, baseLang, Boolean(editingPlaylist)),
                                    },
                                }
                                if (editingPlaylist) await onUpdatePlaylist(editingPlaylist.id, input)
                                else await onCreatePlaylist(input)
                                setPlaylistFormOpen(false)
                            }}
                            disabled={!resolveBase(playlistLangForms, editingPlaylist ? (editingPlaylist.language ?? 'en') : undefined)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Save Playlist
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Song Deletion Confirmation */}
            <TrashConfirm
                open={deletingSong !== null}
                onOpenChange={(open) => !open && setDeletingSong(null)}
                name={deletingSong?.title ?? 'this track'}
                onConfirm={() => {
                    if (deletingSong) onDeleteSong(deletingSong.id)
                    setDeletingSong(null)
                }}
            />

            {/* Playlist Deletion Confirmation */}
            <TrashConfirm
                open={deletingPlaylist !== null}
                onOpenChange={(open) => !open && setDeletingPlaylist(null)}
                name={deletingPlaylist?.title ?? 'this playlist'}
                onConfirm={() => {
                    if (deletingPlaylist) onDeletePlaylist(deletingPlaylist.id)
                    setDeletingPlaylist(null)
                }}
            />

            {/* Floating Audio Player (Matches the bottom player of Image 3!) */}
            {currentPlaying && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-primary text-primary-foreground rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-4 border border-primary-foreground/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <audio
                        ref={audioRef}
                        src={currentPlaying.audioUrl ?? undefined}
                        onEnded={() => setIsPlaying(false)}
                        autoPlay
                    />

                    {/* Track info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={resolveImage(currentPlaying.coverUrl)}
                            alt={currentPlaying.title}
                            className="size-11 rounded-lg object-cover border border-white/20 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate text-white leading-tight">
                                {currentPlaying.title}
                            </span>
                            <span className="text-xs text-white/70 truncate">
                                {currentPlaying.artist}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                const idx = songs.findIndex((s) => s.id === currentPlaying.id)
                                if (idx > 0) handlePlaySong(songs[idx - 1])
                            }}
                            className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                            title="Previous Track"
                        >
                            <SkipBack className="size-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (isPlaying) {
                                    audioRef.current?.pause()
                                    setIsPlaying(false)
                                } else {
                                    audioRef.current?.play()
                                    setIsPlaying(true)
                                }
                            }}
                            className="size-9 rounded-full bg-primary-foreground text-primary flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="size-4 fill-primary" />
                            ) : (
                                <Play className="size-4 fill-primary ml-0.5" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const idx = songs.findIndex((s) => s.id === currentPlaying.id)
                                if (idx < songs.length - 1) handlePlaySong(songs[idx + 1])
                            }}
                            className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                            title="Next Track"
                        >
                            <SkipForward className="size-4" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            audioRef.current?.pause()
                            setIsPlaying(false)
                            setCurrentPlaying(null)
                        }}
                        className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title="Close Player"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
        </div>
    )
}

/** Searchable playlist dropdown (popover + filter). */
function SearchablePlaylistSelect({
    playlists,
    value,
    onChange,
    placeholder = 'Select playlist...',
}: {
    playlists: WorshipPlaylist[]
    value: string
    onChange: (playlistId: string) => void
    placeholder?: string
}) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const selected = playlists.find((p) => p.id === value)
    const filtered = query.trim()
        ? playlists.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()))
        : playlists

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">{selected ? selected.title : placeholder}</span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search playlists..."
                    className="mb-1.5 h-9"
                />
                <div className="max-h-52 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">No playlists found</p>
                    ) : (
                        filtered.map((playlist) => (
                            <button
                                key={playlist.id}
                                type="button"
                                onClick={() => {
                                    onChange(playlist.id)
                                    setOpen(false)
                                    setQuery('')
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted cursor-pointer"
                            >
                                <Check
                                    className={`size-4 shrink-0 ${playlist.id === value ? 'opacity-100' : 'opacity-0'}`}
                                />
                                <span className="truncate">{playlist.title}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
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
