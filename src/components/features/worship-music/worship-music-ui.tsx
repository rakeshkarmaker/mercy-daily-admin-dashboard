import { useMemo, useState, useRef, useEffect } from 'react'
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
import {
    CheckCircle2,
    Calendar,
    Clock,
    Headphones,
    ListMusic,
    Music,
    Pause,
    Pencil,
    Play,
    Plus,
    RotateCcw,
    SkipBack,
    SkipForward,
    Sparkles,
    Trash2,
    Volume2,
    X,
    Radio,
    BookOpen,
    Flame,
} from 'lucide-react'
import type {
    WorshipSong,
    WorshipPlaylist,
    WorshipHeroBanner,
    WorshipArtist,
} from '@/api/worship-music'

export interface WorshipMusicUIProps {
    songs: WorshipSong[]
    playlists: WorshipPlaylist[]
    banner: WorshipHeroBanner
    artists: WorshipArtist[]
    searchQuery: string
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onSaveSong: (song: WorshipSong) => void
    onDeleteSong: (id: string) => void
    onSavePlaylist: (playlist: WorshipPlaylist) => void
    onDeletePlaylist: (id: string) => void
    onSaveBanner: (banner: WorshipHeroBanner) => void
}

type SongFormState = {
    title: string
    artist: string
    category: string
    duration: string
    audioUrl: string
    coverUrl: string
    bibleReference: string
    playlistId: string
    status: 'Published' | 'Scheduled' | 'Draft'
    scheduledDate: string
    isFeatured: boolean
    language: string
    description: string
}

const emptySongForm: SongFormState = {
    title: '',
    artist: 'Mercy Daily Worship',
    category: 'Gratitude',
    duration: '4:00',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=400&q=80',
    bibleReference: 'Psalm 103:1',
    playlistId: 'pl-1',
    status: 'Published',
    scheduledDate: new Date().toISOString().slice(0, 10),
    isFeatured: false,
    language: 'English',
    description: '',
}

export function WorshipMusicUI({
    songs,
    playlists,
    banner,
    artists,
    searchQuery,
    onSearchChange,
    onResetSearch,
    onSaveSong,
    onDeleteSong,
    onSavePlaylist,
    onDeletePlaylist,
    onSaveBanner,
}: WorshipMusicUIProps) {
    const [mainTab, setMainTab] = useState<'songs' | 'playlists' | 'banner' | 'artists'>('songs')
    const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Scheduled' | 'Draft'>('all')

    // Modals
    const [songFormOpen, setSongFormOpen] = useState(false)
    const [editingSong, setEditingSong] = useState<WorshipSong | null>(null)
    const [songForm, setSongForm] = useState<SongFormState>(emptySongForm)
    const [deletingSong, setDeletingSong] = useState<WorshipSong | null>(null)

    const [playlistFormOpen, setPlaylistFormOpen] = useState(false)
    const [editingPlaylist, setEditingPlaylist] = useState<WorshipPlaylist | null>(null)
    const [playlistForm, setPlaylistForm] = useState<WorshipPlaylist>({
        id: '',
        title: '',
        description: '',
        coverUrl: '',
        songCount: 0,
        isFeatured: false,
        category: 'Worship',
        createdAt: new Date().toISOString(),
    })
    const [deletingPlaylist, setDeletingPlaylist] = useState<WorshipPlaylist | null>(null)

    // Banner Edit State
    const [bannerEditing, setBannerEditing] = useState<WorshipHeroBanner>(banner)

    // Audio Playback Preview State (App replica!)
    const [currentPlaying, setCurrentPlaying] = useState<WorshipSong | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Filter songs by search and status
    const filteredSongs = useMemo(() => {
        let result = songs
        if (statusFilter !== 'all') {
            result = result.filter((s) => s.status === statusFilter)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (s) =>
                    s.title.toLowerCase().includes(q) ||
                    s.artist.toLowerCase().includes(q) ||
                    s.category.toLowerCase().includes(q) ||
                    (s.bibleReference ?? '').toLowerCase().includes(q),
            )
        }
        return result
    }, [songs, statusFilter, searchQuery])

    // Stat Cards
    const stats = useMemo(() => {
        const totalSongs = songs.length
        const totalPlaylists = playlists.length
        const featuredCount = songs.filter((s) => s.isFeatured).length
        const totalPlays = songs.reduce((acc, s) => acc + (s.playsCount || 0), 0)
        return { totalSongs, totalPlaylists, featuredCount, totalPlays }
    }, [songs, playlists])

    const statCards = useMemo<StatCardProps[]>(
        () => [
            {
                label: 'Total Worship Songs',
                value: stats.totalSongs,
                icon: Music,
                color: 'emerald',
            },
            {
                label: 'Worship Playlists',
                value: stats.totalPlaylists,
                icon: ListMusic,
                color: 'blue',
            },
            {
                label: 'Featured Top Songs',
                value: stats.featuredCount,
                icon: Sparkles,
                color: 'amber',
            },
            {
                label: 'Total Streams / Plays',
                value: stats.totalPlays.toLocaleString(),
                icon: Headphones,
                color: 'pink',
            },
        ],
        [stats],
    )

    const openCreateSong = () => {
        setEditingSong(null)
        setSongForm(emptySongForm)
        setSongFormOpen(true)
    }

    const openEditSong = (song: WorshipSong) => {
        setEditingSong(song)
        setSongForm({
            title: song.title,
            artist: song.artist,
            category: song.category,
            duration: song.duration,
            audioUrl: song.audioUrl ?? '',
            coverUrl: song.coverUrl ?? '',
            bibleReference: song.bibleReference ?? song.bibleVerse ?? '',
            playlistId: song.playlistId ?? 'pl-1',
            status: song.status,
            scheduledDate: song.scheduledDate ? song.scheduledDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            isFeatured: song.isFeatured,
            language: song.language ?? 'English',
            description: song.description ?? '',
        })
        setSongFormOpen(true)
    }

    const submitSongForm = () => {
        if (!songForm.title.trim() || !songForm.artist.trim()) return

        const matchedPlaylist = playlists.find((p) => p.id === songForm.playlistId)

        const songToSave: WorshipSong = {
            id: editingSong ? editingSong.id : `song-${Date.now()}`,
            title: songForm.title.trim(),
            artist: songForm.artist.trim(),
            category: songForm.category,
            duration: songForm.duration.trim() || '4:00',
            audioUrl: songForm.audioUrl.trim(),
            coverUrl: songForm.coverUrl.trim(),
            bibleReference: songForm.bibleReference.trim(),
            bibleVerse: songForm.bibleReference.trim(),
            playlistId: songForm.playlistId,
            playlistTitle: matchedPlaylist?.title ?? 'Worship',
            status: songForm.status,
            scheduledDate: songForm.scheduledDate ? `${songForm.scheduledDate}T00:00:00Z` : undefined,
            isFeatured: songForm.isFeatured,
            playsCount: editingSong ? editingSong.playsCount : 0,
            language: songForm.language,
            description: songForm.description,
            createdAt: editingSong ? editingSong.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        onSaveSong(songToSave)
        setSongFormOpen(false)
    }

    const toggleSongFeatured = (song: WorshipSong) => {
        onSaveSong({
            ...song,
            isFeatured: !song.isFeatured,
            updatedAt: new Date().toISOString(),
        })
    }

    // Audio playback toggle
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
                                    src={row.coverUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=100&q=80'}
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
                                            <Sparkles className="size-2.5 mr-0.5" /> Top
                                        </Badge>
                                    )}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="size-3" /> {row.duration}
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
                key: 'category',
                header: 'CATEGORY',
                render: (row) => (
                    <Badge variant="outline" className="text-xs bg-muted/30">
                        {row.category}
                    </Badge>
                ),
            },
            {
                key: 'bibleVerse',
                header: 'ASSIGNED BIBLE VERSE',
                render: (row) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-56 truncate">
                        <BookOpen className="size-3 shrink-0 text-primary" />
                        <span className="truncate">{row.bibleReference || row.bibleVerse || '—'}</span>
                    </div>
                ),
            },
            {
                key: 'scheduledDate',
                header: 'SCHEDULED DATE',
                render: (row) => (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.scheduledDate
                            ? new Date(row.scheduledDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                              })
                            : new Date(row.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                              })}
                    </span>
                ),
            },
            {
                key: 'status',
                header: 'STATUS',
                render: (row) => {
                    if (row.status === 'Published') {
                        return (
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                                <CheckCircle2 className="size-3" /> Published
                            </Badge>
                        )
                    }
                    if (row.status === 'Scheduled') {
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
                            label={row.isFeatured ? 'Remove from Top Worship' : 'Pin to Top Worship Songs'}
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
                description="Manage praise and worship audio tracks, featured playlists, and artist profiles featured on the mobile app."
            >
                <div className="flex items-center gap-2">
                    <Button onClick={openCreateSong} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm">
                        <Plus className="size-4" /> Add Music
                    </Button>
                </div>
            </PageHeader>

            <StatCardsGrid cards={statCards} />

            {/* View Switching Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="songs" className="gap-1.5">
                            <Music className="size-4" /> Songs Library
                        </TabsTrigger>
                        <TabsTrigger value="playlists" className="gap-1.5">
                            <ListMusic className="size-4" /> Popular Playlists
                        </TabsTrigger>
                        <TabsTrigger value="banner" className="gap-1.5">
                            <Flame className="size-4" /> Featured Hero Banner
                        </TabsTrigger>
                        <TabsTrigger value="artists" className="gap-1.5">
                            <Radio className="size-4" /> Artists
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {mainTab === 'songs' && (
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Status : All</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                <SelectItem value="Draft">Draft</SelectItem>
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
                        total={filteredSongs.length}
                        page={1}
                        limit={filteredSongs.length || 10}
                        noun="worship tracks"
                        onReset={onResetSearch}
                        emptyIcon={<Music className="size-8 text-muted-foreground" />}
                    />
                </div>
            )}

            {/* Tab 2: Popular Playlists */}
            {mainTab === 'playlists' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Popular Playlists</h3>
                            <p className="text-xs text-muted-foreground">
                                These playlists are displayed in the carousel on the mobile app home screen.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingPlaylist(null)
                                setPlaylistForm({
                                    id: `pl-${Date.now()}`,
                                    title: '',
                                    description: '',
                                    coverUrl: '',
                                    songCount: 0,
                                    isFeatured: true,
                                    category: 'Worship',
                                    createdAt: new Date().toISOString(),
                                })
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
                                    <img src={pl.coverUrl} alt={pl.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                        <h4 className="font-bold text-white text-base leading-tight drop-shadow-sm">
                                            {pl.title}
                                        </h4>
                                        <span className="text-xs text-white/80 font-medium">
                                            {pl.songCount} songs
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
                                        <Badge variant="outline" className="text-[10px]">
                                            {pl.category}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <ActionButton
                                                label="Edit playlist"
                                                onClick={() => {
                                                    setEditingPlaylist(pl)
                                                    setPlaylistForm(pl)
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

            {/* Tab 3: Featured Hero Banner Editor */}
            {mainTab === 'banner' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Live Mobile Preview */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <Sparkles className="size-4 text-warning" /> Mobile App Live Banner Preview
                        </h3>
                        <div className="rounded-3xl border-2 border-border p-4 bg-muted/20 flex flex-col items-center">
                            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-border/80 relative aspect-16/10 group">
                                <img
                                    src={bannerEditing.coverUrl}
                                    alt={bannerEditing.title}
                                    className="size-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-5 flex flex-col justify-end">
                                    <h2 className="text-white text-xl font-bold leading-tight mb-1">
                                        {bannerEditing.title}
                                    </h2>
                                    <p className="text-white/80 text-xs mb-3 line-clamp-2">
                                        {bannerEditing.subtitle}
                                    </p>
                                    <Button
                                        size="sm"
                                        className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs px-4 h-8 gap-1.5 shadow"
                                    >
                                        <Play className="size-3 fill-primary-foreground" /> {bannerEditing.buttonText}
                                    </Button>
                                </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-3">
                                As rendered on the iOS / Android Worship Music screen
                            </span>
                        </div>
                    </div>

                    {/* Banner Edit Form */}
                    <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
                        <h3 className="font-semibold text-foreground text-sm">Banner Configuration</h3>
                        <div className="grid gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="bannerTitle" className="text-xs font-medium">
                                    Banner Heading
                                </Label>
                                <Input
                                    id="bannerTitle"
                                    value={bannerEditing.title}
                                    onChange={(e) => setBannerEditing({ ...bannerEditing, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="bannerSubtitle" className="text-xs font-medium">
                                    Banner Subtitle / Tagline
                                </Label>
                                <Input
                                    id="bannerSubtitle"
                                    value={bannerEditing.subtitle}
                                    onChange={(e) => setBannerEditing({ ...bannerEditing, subtitle: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="bannerImage" className="text-xs font-medium">
                                    Background Cover Image URL
                                </Label>
                                <Input
                                    id="bannerImage"
                                    value={bannerEditing.coverUrl}
                                    onChange={(e) => setBannerEditing({ ...bannerEditing, coverUrl: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="bannerButton" className="text-xs font-medium">
                                    Button Action Label
                                </Label>
                                <Input
                                    id="bannerButton"
                                    value={bannerEditing.buttonText}
                                    onChange={(e) => setBannerEditing({ ...bannerEditing, buttonText: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                                <div>
                                    <Label className="text-sm font-medium">Banner Active in App</Label>
                                    <p className="text-xs text-muted-foreground">Show this featured banner prominently in the app</p>
                                </div>
                                <Switch
                                    checked={bannerEditing.isActive}
                                    onCheckedChange={(checked) => setBannerEditing({ ...bannerEditing, isActive: checked })}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={() => onSaveBanner(bannerEditing)}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Save Banner Changes
                        </Button>
                    </div>
                </div>
            )}

            {/* Tab 4: Artists List */}
            {mainTab === 'artists' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {artists.map((artist) => (
                        <div
                            key={artist.id}
                            className="rounded-2xl border border-border p-4 bg-card flex flex-col items-center text-center gap-3 shadow-sm hover:border-primary/50 transition-colors"
                        >
                            <div className="size-20 rounded-full overflow-hidden border-2 border-border shadow-md">
                                <img src={artist.imageUrl} alt={artist.name} className="size-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">{artist.name}</h4>
                                <span className="text-xs text-muted-foreground">{artist.tracksCount} tracks cataloged</span>
                            </div>
                            {artist.bio && (
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {artist.bio}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Song Dialog (Faithful to Figma & App) */}
            <Dialog open={songFormOpen} onOpenChange={setSongFormOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingSong ? 'Edit Worship Music' : 'Add New Worship Music'}</DialogTitle>
                        <DialogDescription>
                            Configure audio metadata, scripture references, cover art, and scheduling for the app.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Information Section */}
                        <div className="border-b pb-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Track Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">
                                        Track Title <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        value={songForm.title}
                                        onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                                        placeholder="e.g. Goodness of God"
                                        required
                                    />
                                </div>
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Category</Label>
                                    <Select
                                        value={songForm.category}
                                        onValueChange={(val) => setSongForm({ ...songForm, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Gratitude">Gratitude</SelectItem>
                                            <SelectItem value="Prayer for Peace">Prayer for Peace</SelectItem>
                                            <SelectItem value="Encouragement">Encouragement</SelectItem>
                                            <SelectItem value="Faith & Trust">Faith & Trust</SelectItem>
                                            <SelectItem value="Praise & Adoration">Praise & Adoration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Duration (mm:ss)</Label>
                                    <Input
                                        value={songForm.duration}
                                        onChange={(e) => setSongForm({ ...songForm, duration: e.target.value })}
                                        placeholder="e.g. 4:32"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Playlist</Label>
                                    <Select
                                        value={songForm.playlistId}
                                        onValueChange={(val) => setSongForm({ ...songForm, playlistId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {playlists.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Scripture Reference Section (Matching Figma Image 2!) */}
                        <div className="border-b pb-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="size-3.5 text-primary" /> Bible Reference
                            </h4>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Assigned Bible Verse / Reference</Label>
                                <Input
                                    value={songForm.bibleReference}
                                    onChange={(e) => setSongForm({ ...songForm, bibleReference: e.target.value })}
                                    placeholder="e.g. Psalm 23:6 - Surely goodness and mercy shall follow me..."
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-medium">Description / Devotional Context</Label>
                                <Textarea
                                    rows={2}
                                    value={songForm.description}
                                    onChange={(e) => setSongForm({ ...songForm, description: e.target.value })}
                                    placeholder="Provide background or prayer focus for this track..."
                                />
                            </div>
                        </div>

                        {/* Media & Audio Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Volume2 className="size-3.5 text-pink-500" /> Audio & Media Files
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Cover Image URL</Label>
                                    <Input
                                        value={songForm.coverUrl}
                                        onChange={(e) => setSongForm({ ...songForm, coverUrl: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Audio Stream URL (.mp3)</Label>
                                    <Input
                                        value={songForm.audioUrl}
                                        onChange={(e) => setSongForm({ ...songForm, audioUrl: e.target.value })}
                                        placeholder="https://example.com/audio.mp3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Publishing Status</Label>
                                    <Select
                                        value={songForm.status}
                                        onValueChange={(val) => setSongForm({ ...songForm, status: val as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Published">Published</SelectItem>
                                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-medium">Scheduled Date</Label>
                                    <Input
                                        type="date"
                                        value={songForm.scheduledDate}
                                        onChange={(e) => setSongForm({ ...songForm, scheduledDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                                <div>
                                    <Label className="text-xs font-medium cursor-pointer">
                                        Pin in Top Worship Songs
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Feature prominently on the Worship Music mobile screen
                                    </p>
                                </div>
                                <Switch
                                    checked={songForm.isFeatured}
                                    onCheckedChange={(checked) => setSongForm({ ...songForm, isFeatured: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSongFormOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitSongForm}
                            disabled={!songForm.title.trim() || !songForm.artist.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {editingSong ? 'Save Changes' : 'Add Music Track'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Playlist Dialog */}
            <Dialog open={playlistFormOpen} onOpenChange={setPlaylistFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}</DialogTitle>
                        <DialogDescription>
                            Configure playlist title, cover image, and category for the app.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Playlist Title *</Label>
                            <Input
                                value={playlistForm.title}
                                onChange={(e) => setPlaylistForm({ ...playlistForm, title: e.target.value })}
                                placeholder="e.g. Morning Worship"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Description</Label>
                            <Textarea
                                rows={2}
                                value={playlistForm.description}
                                onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                                placeholder="e.g. Start your day in quiet prayer..."
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Cover Image URL</Label>
                            <Input
                                value={playlistForm.coverUrl}
                                onChange={(e) => setPlaylistForm({ ...playlistForm, coverUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-medium">Category</Label>
                            <Input
                                value={playlistForm.category}
                                onChange={(e) => setPlaylistForm({ ...playlistForm, category: e.target.value })}
                                placeholder="e.g. Prayer for Peace"
                            />
                        </div>
                        <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                            <div>
                                <Label className="text-xs font-medium">Feature in App Carousel</Label>
                                <p className="text-[11px] text-muted-foreground">Show in Popular Playlists</p>
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
                            onClick={() => {
                                onSavePlaylist(playlistForm)
                                setPlaylistFormOpen(false)
                            }}
                            disabled={!playlistForm.title.trim()}
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
                        src={currentPlaying.audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        autoPlay
                    />

                    {/* Track info */}
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={currentPlaying.coverUrl}
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
