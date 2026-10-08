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
import { CONTENT_LANGUAGES, languageLabel } from '@/lib/language'
import type { ContentLanguage } from '@/lib/language'
import { LanguageViewFilter } from '@/components/shared/language-view-filter'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ImageUpload } from '@/components/shared/image-upload'
import {
    Check,
    CheckCircle2,
    Calendar,
    ChevronsUpDown,
    Clock,
    ImagePlus,
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
    status: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
    onStatusChange: (status: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') => void
    /** Active content language — the server projects it onto every row. */
    language: ContentLanguage
    onLanguageChange: (language: ContentLanguage) => void
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
 * Language blocks for a new/existing entity. English always exists (it is
 * canonical and lives in the base columns); esp/por are optional and fall
 * back to English per field when empty.
 */
const createEmptyLanguageForms = (): LanguageForms => ({
    en: emptyLanguageForm(),
    esp: emptyLanguageForm(),
    por: emptyLanguageForm(),
})

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

/** Language blocks from an existing song (en = top-level fields). */
const songLanguageForms = (song: WorshipSong): LanguageForms => ({
    en: {
        title: song.title,
        description: song.description ?? '',
        bibleReference: song.bibleReference ?? '',
    },
    esp: (() => {
        const t = song.translations.find((t) => t.language === 'esp')
        return t
            ? { title: t.title, description: t.description ?? '', bibleReference: t.bibleReference ?? '' }
            : emptyLanguageForm()
    })(),
    por: (() => {
        const t = song.translations.find((t) => t.language === 'por')
        return t
            ? { title: t.title, description: t.description ?? '', bibleReference: t.bibleReference ?? '' }
            : emptyLanguageForm()
    })(),
})

/**
 * esp/por sync blocks. A block with a title upserts that language; an empty
 * title on update removes the stored translation.
 */
function toSongTranslations(
    forms: LanguageForms,
    editing: boolean,
): SongTranslationInput[] {
    const items: SongTranslationInput[] = []
    for (const language of ['esp', 'por'] as const) {
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

/** Language blocks for a playlist (en = top-level fields). */
const playlistLanguageForms = (playlist: WorshipPlaylist): LanguageForms => ({
    en: {
        title: playlist.title,
        description: playlist.description ?? '',
        bibleReference: '',
    },
    esp: (() => {
        const t = playlist.translations.find((t) => t.language === 'esp')
        return t ? { title: t.title, description: t.description ?? '', bibleReference: '' } : emptyLanguageForm()
    })(),
    por: (() => {
        const t = playlist.translations.find((t) => t.language === 'por')
        return t ? { title: t.title, description: t.description ?? '', bibleReference: '' } : emptyLanguageForm()
    })(),
})

type PlaylistFormState = PlaylistInput & { coverUrl: string; description: string; isFeatured: boolean }

/** True when the row actually carries content in that language. */
function hasSongLanguage(song: WorshipSong, language: ContentLanguage): boolean {
    if (language === 'en') return true
    return song.translations.some((t) => t.language === language)
}

function hasPlaylistLanguage(playlist: WorshipPlaylist, language: ContentLanguage): boolean {
    if (language === 'en') return true
    return playlist.translations.some((t) => t.language === language)
}

/** Small language availability dot for title cells and cards. */
function LanguageDot({ language, available }: { language: ContentLanguage; available: boolean }) {
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

/** esp/por playlist sync blocks (empty title on update removes the row). */
function toPlaylistTranslations(forms: LanguageForms, editing: boolean): PlaylistTranslationInput[] {
    const items: PlaylistTranslationInput[] = []
    for (const language of ['esp', 'por'] as const) {
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

/** A language tab strip shared by the song/playlist dialogs. */
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
                        {language.value !== 'en' && forms[language.value].title.trim() && (
                            <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
            {CONTENT_LANGUAGES.map((language) => {
                const form = forms[language.value]
                const isEnglish = language.value === 'en'
                const set = (key: keyof LanguageFormState, next: string) =>
                    onFormChange(language.value, { ...form, [key]: next })
                return (
                    <TabsContent key={language.value} value={language.value} className="mt-0">
                        <div className="space-y-3">
                            <p className="text-[11px] text-muted-foreground">
                                {isEnglish
                                    ? 'Canonical English content, stored in the base fields.'
                                    : `Optional ${languageLabel(language.value)} translation. Leave the title empty to remove it; empty fields fall back to English.`}
                            </p>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">
                                    Title {isEnglish && <span className="text-destructive">*</span>}
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => set('title', e.target.value)}
                                    placeholder={isEnglish ? 'e.g. Goodness of God' : 'Translated title'}
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
                                    placeholder={
                                        language.value === 'en' ? 'Background or prayer focus...' : 'Translated text'
                                    }
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
    status,
    onStatusChange,
    language,
    onLanguageChange,
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

    const openCreateSong = () => {
        setEditingSong(null)
        setSongForm({ ...emptySongForm, playlistId: playlists[0]?.id ?? '' })
        setSongLangForms(createEmptyLanguageForms())
        setSongLang('en')
        setSongFormOpen(true)
    }

    const openEditSong = (song: WorshipSong) => {
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
        setSongLang('en')
        setSongFormOpen(true)
    }

    const submitSongForm = async () => {
        const en = songLangForms.en
        if (!en.title.trim() || !songForm.artist.trim()) return

        const input: SongInput = {
            title: en.title.trim(),
            artist: songForm.artist.trim() || undefined,
            durationSeconds: minutesToSeconds(songForm.durationMinutes),
            audioUrl: songForm.audioUrl.trim() || null,
            coverUrl: songForm.coverUrl.trim() || null,
            description: en.description.trim() || null,
            bibleReference: en.bibleReference.trim() || null,
            playlistId: songForm.playlistId || null,
            status: songForm.status,
            isFeatured: songForm.isFeatured,
            translations: {
                items: toSongTranslations(songLangForms, Boolean(editingSong)),
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentPlaying, isPlaying],
    )

    return (
        <div className="space-y-6 pb-24">
            <PageHeader
                title="Worship Music"
                description="Manage praise and worship audio tracks and playlists on the mobile app."
            >
                <div className="flex items-center gap-2">
                    <Button onClick={openCreateSong} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm">
                        <Plus className="size-4" /> Add Music
                    </Button>
                </div>
            </PageHeader>

            {/* <StatCardsGrid cards={statCards} /> */}

            {/* View Switching Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="songs" className="gap-1.5">
                            <Music className="size-4" /> Songs Library
                        </TabsTrigger>
                        <TabsTrigger value="playlists" className="gap-1.5">
                            <ListMusic className="size-4" /> Featured Playlists
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <LanguageViewFilter value={language} onChange={onLanguageChange} />

                {mainTab === 'songs' && (
                    <div className="flex items-center gap-3">
                        <Select value={status} onValueChange={(val) => onStatusChange(val as typeof status)}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Status : All</SelectItem>
                                <SelectItem value="PUBLISHED">Published</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                            </SelectContent>
                        </Select>

                        <SearchInput
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            placeholder="Search title, artist, verse..."
                            className="w-full sm:w-64"
                        />
                        <Button
                            onClick={openCreateSong}
                            size="sm"
                            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shrink-0"
                        >
                            <Plus className="size-4" /> Add Music
                        </Button>
                    </div>
                )}
            </div>

            {/* Tab 1: Songs Table */}
            {mainTab === 'songs' && (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                </div>
            )}

            {/* Tab 2: Featured Playlists */}
            {mainTab === 'playlists' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Featured Playlists</h3>
                            <p className="text-xs text-muted-foreground">
                                These playlists are displayed in the carousel on the mobile app home screen.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
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
                            }}
                            className="gap-1.5"
                        >
                            <Plus className="size-4" /> Add Playlist
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {playlists.map((pl) => (
                            <div
                                key={pl.id}
                                className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                                    <img src={resolveImage(pl.coverUrl)} alt={pl.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
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
                                                    setEditingPlaylist(pl)
                                                    setPlaylistForm({
                                                        title: pl.title,
                                                        description: pl.description ?? '',
                                                        coverUrl: pl.coverUrl ?? '',
                                                        isFeatured: pl.isFeatured,
                                                    })
                                                    setPlaylistLangForms(playlistLanguageForms(pl))
                                                    setPlaylistLang('en')
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
                            Switch tabs to manage each language. English is canonical; Spanish and Portuguese are
                            optional and fall back to English when fields are empty.
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
                            disabled={!songLangForms.en.title.trim() || !songForm.artist.trim()}
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
                                const en = playlistLangForms.en
                                const input: PlaylistInput = {
                                    title: en.title.trim(),
                                    description: en.description.trim() || null,
                                    coverUrl: playlistForm.coverUrl.trim() || null,
                                    isFeatured: playlistForm.isFeatured,
                                    translations: {
                                        items: toPlaylistTranslations(playlistLangForms, Boolean(editingPlaylist)),
                                    },
                                }
                                if (editingPlaylist) await onUpdatePlaylist(editingPlaylist.id, input)
                                else await onCreatePlaylist(input)
                                setPlaylistFormOpen(false)
                            }}
                            disabled={!playlistLangForms.en.title.trim()}
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
