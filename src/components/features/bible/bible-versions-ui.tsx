import { useState, useMemo } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import {
    ArrowLeft,
    BookCheck,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    CloudDownload,
    Globe,
    Languages,
    Layers,
    Loader2,
    MessageSquare,
    RefreshCw,
    Sparkles,
    Trash2,
} from 'lucide-react'
import {
    CANONICAL_BIBLE_BOOKS,
    CURATED_TRANSLATIONS,
} from '@/api/bible'
import type {
    AvailableTranslation,
    BookChaptersResponse,
    BookDetail,
    ChapterDetailResponse,
    CuratedTranslation,
    SyncStatusResponse,
    SyncedVersion,
} from '@/api/bible'

// ── Props ──────────────────────────────────────────────────────────────────

export interface BibleVersionsUIProps {
    availableTranslations: AvailableTranslation[]
    syncedVersions: SyncedVersion[]
    loadingAvailable: boolean
    loadingSynced: boolean
    syncingCode: string | null
    syncStatus: SyncStatusResponse | null | undefined
    tab: string
    language: string
    searchQuery: string
    availablePage: number
    availableLimit: number
    selectedVersionCode: string
    books: BookDetail[]
    loadingBooks: boolean
    selectedBookChapters: BookChaptersResponse | null
    loadingChapters: boolean
    selectedChapterDetail: ChapterDetailResponse | null
    loadingChapterDetail: boolean
    onTabChange: (tab: string) => void
    onLanguageChange: (lang: string) => void
    onSearchChange: (value: string) => void
    onResetSearch: () => void
    onSyncVersion: (
        code: string,
        options?: { bookIds?: string[]; testament?: 'OLD' | 'NEW' },
    ) => Promise<void>
    onDeleteVersion: (id: number) => Promise<void>
    onDeleteBook: (versionCode: string, bookSlug: string) => Promise<void>
    onToggleVersion: (id: number) => Promise<void>
    onSelectVersionCode: (code: string) => void
    onOpenBookChapters: (bookSlug: string) => void
    onCloseBookChapters: () => void
    onOpenChapterDetail: (bookSlug: string, chapterNumber: number) => void
    onCloseChapterDetail: () => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function BibleVersionsUI({
    availableTranslations,
    syncedVersions,
    loadingAvailable,
    loadingSynced,
    syncingCode,
    syncStatus,
    tab,
    language,
    searchQuery,
    availablePage,
    availableLimit,
    selectedVersionCode,
    books,
    loadingBooks,
    selectedBookChapters,
    loadingChapters,
    selectedChapterDetail,
    loadingChapterDetail,
    onTabChange,
    onLanguageChange,
    onSearchChange,
    onResetSearch,
    onSyncVersion,
    onDeleteVersion,
    onDeleteBook,
    onToggleVersion,
    onSelectVersionCode,
    onOpenBookChapters,
    onCloseBookChapters,
    onOpenChapterDetail,
    onCloseChapterDetail,
}: BibleVersionsUIProps) {
    const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OLD' | 'NEW'>('ALL')
    const [syncFilter, setSyncFilter] = useState<'ALL' | 'SYNCED' | 'UNSYNCED'>('ALL')
    const [bookSearchQuery, setBookSearchQuery] = useState('')
    const [syncingSet, setSyncingSet] = useState<Set<string>>(new Set())

    const syncedCodes = useMemo(
        () => new Set(syncedVersions.map((v) => v.code.toUpperCase())),
        [syncedVersions],
    )

    const activeSyncedCount = useMemo(
        () => syncedVersions.filter((v) => v.isActive !== false).length,
        [syncedVersions],
    )

    // Sum total discussions across all books
    const totalCommunityDiscussions = useMemo(
        () => books.reduce((sum, b) => sum + (b.discussionsCount || 0), 0),
        [books],
    )

    // Build unique language list from available translations
    const languageOptions = useMemo(() => {
        return Array.from(
            new Set(availableTranslations.map((t) => t.language).filter(Boolean)),
        ).sort()
    }, [availableTranslations])

    // Map all 66 canonical books against synced books for selected version
    const canonicalBooksWithStatus = useMemo(() => {
        const syncedBySlug = new Map<string, BookDetail>()
        const syncedByNumber = new Map<number, BookDetail>()
        books.forEach((b) => {
            syncedBySlug.set(b.slug.toLowerCase(), b)
            syncedByNumber.set(b.bookNumber, b)
        })

        return CANONICAL_BIBLE_BOOKS.map((cb) => {
            const synced =
                syncedBySlug.get(cb.slug.toLowerCase()) ||
                syncedByNumber.get(cb.bookNumber)
            return {
                canonical: cb,
                isSynced: !!synced,
                syncedBook: synced ?? null,
                name: synced?.name ?? cb.name,
                slug: synced?.slug ?? cb.slug,
                bookNumber: cb.bookNumber,
                testament: cb.testament,
                chapterCount: synced ? synced.chapterCount : cb.expectedChapters,
                totalVerses: synced ? synced.totalVerses : 0,
                discussionsCount: synced ? synced.discussionsCount : 0,
            }
        })
    }, [books])

    const totalSyncedCount = useMemo(() => books.length, [books])
    const otSyncedCount = useMemo(
        () => books.filter((b) => b.testament === 'OLD').length,
        [books],
    )
    const ntSyncedCount = useMemo(
        () => books.filter((b) => b.testament === 'NEW').length,
        [books],
    )

    // Filter books by Testament, Sync Status, and Search Query
    const filteredCanonicalBooks = useMemo(() => {
        let result = canonicalBooksWithStatus

        if (testamentFilter !== 'ALL') {
            result = result.filter((b) => b.testament === testamentFilter)
        }

        if (syncFilter === 'SYNCED') {
            result = result.filter((b) => b.isSynced)
        } else if (syncFilter === 'UNSYNCED') {
            result = result.filter((b) => !b.isSynced)
        }

        if (bookSearchQuery.trim()) {
            const q = bookSearchQuery.trim().toLowerCase()
            result = result.filter(
                (b) =>
                    b.name.toLowerCase().includes(q) ||
                    b.slug.toLowerCase().includes(q) ||
                    b.canonical.id.toLowerCase().includes(q) ||
                    String(b.bookNumber).includes(q),
            )
        }

        return result
    }, [canonicalBooksWithStatus, testamentFilter, syncFilter, bookSearchQuery])

    // Filter available catalog
    const filteredAvailable = useMemo(() => {
        let result = availableTranslations
        if (language && language !== 'ALL') {
            result = result.filter((t) => t.language === language)
        }
        const q = searchQuery.trim().toLowerCase()
        if (q) {
            result = result.filter(
                (t) =>
                    t.id.toLowerCase().includes(q) ||
                    t.name.toLowerCase().includes(q) ||
                    t.language.toLowerCase().includes(q),
            )
        }
        return result
    }, [availableTranslations, language, searchQuery])

    const paginatedAvailable = useMemo(() => {
        const start = (availablePage - 1) * availableLimit
        return filteredAvailable.slice(start, start + availableLimit)
    }, [filteredAvailable, availablePage, availableLimit])

    const handleSync = async (
        code: string,
        options?: { bookIds?: string[]; testament?: 'OLD' | 'NEW' },
    ) => {
        const key = options?.testament
            ? `${code}-${options.testament}`
            : options?.bookIds
            ? `${code}-${options.bookIds.join(',')}`
            : code
        setSyncingSet((prev) => new Set(prev).add(key))
        try {
            await onSyncVersion(code, options)
        } finally {
            setSyncingSet((prev) => {
                const next = new Set(prev)
                next.delete(key)
                return next
            })
        }
    }

    // ── Catalog Table Columns ──────────────────────────────────────────────
    const availableColumns: DataTableColumn<AvailableTranslation>[] = [
        {
            key: 'id',
            header: 'Code',
            render: (row) => (
                <span className="font-mono font-medium text-xs text-foreground bg-muted px-2 py-0.5 rounded">
                    {row.id}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Translation Name',
            render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
            key: 'language',
            header: 'Language',
            render: (row) => (
                <Badge variant="outline" className="text-xs">
                    {row.language}
                </Badge>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (row) => {
                const isSynced = syncedCodes.has(row.id.toUpperCase())
                return isSynced ? (
                    <Badge className="border-success/20 bg-success/10 text-success gap-1 text-xs">
                        <CheckCircle2 className="size-3" /> Synced
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="text-xs">
                        Available
                    </Badge>
                )
            },
        },
        {
            key: 'actions',
            header: 'Action',
            className: 'text-right',
            render: (row) => {
                const isSynced = syncedCodes.has(row.id.toUpperCase())
                const isSyncing = syncingSet.has(row.id) || syncingCode === row.id
                return (
                    <Button
                        size="sm"
                        variant={isSynced ? 'outline' : 'default'}
                        disabled={isSyncing}
                        onClick={() => handleSync(row.id)}
                        className="gap-1.5"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Syncing...
                            </>
                        ) : isSynced ? (
                            <>
                                <RefreshCw className="size-3.5" />
                                Re-sync
                            </>
                        ) : (
                            <>
                                <BookOpen className="size-3.5" />
                                Sync Version
                            </>
                        )}
                    </Button>
                )
            },
        },
    ]

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Bible Management & Content Explorer"
                description="Manage and curate Bible translations for the Mercy Daily mobile app, explore canonical books, preview chapter scripture, and monitor community engagement."
            />

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Active App Translations"
                    value={activeSyncedCount}
                    icon={BookCheck}
                    color="emerald"
                />
                <StatCard
                    label="Canonical Books"
                    value={books.length > 0 ? books.length : '66'}
                    icon={Layers}
                    color="blue"
                />
                <StatCard
                    label="Supported Languages"
                    value="3 Languages"
                    icon={Languages}
                    color="orange"
                />
                <StatCard
                    label="Community Discussions"
                    value={totalCommunityDiscussions.toLocaleString()}
                    icon={MessageSquare}
                    color="amber"
                />
            </div>

            {/* Main Tabs */}
            <Tabs value={tab} onValueChange={onTabChange} className="space-y-6">
                <TabsList
                    variant="line"
                    className="mb-3 w-full max-w-full justify-start overflow-x-auto border-b border-border/50"
                >
                    <TabsTrigger value="curated" className="flex-none gap-2 px-4">
                        <Sparkles className="size-4 text-warning" />
                        App Translations & Quick-Setup
                    </TabsTrigger>
                    <TabsTrigger value="explorer" className="flex-none gap-2 px-4">
                        <BookOpen className="size-4" />
                        Book Explorer (App Mirror)
                        {books.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {books.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="catalog" className="flex-none gap-2 px-4">
                        <Globe className="size-4" />
                        Global Archive
                        <Badge variant="outline" className="ml-1 text-xs">
                            1,256
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                {/* ── TAB 1: CURATED APP PACK & SYNCED VERSIONS ─────────────────── */}
                <TabsContent value="curated" className="space-y-8">
                    {/* Curated Shelf */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <Sparkles className="size-4 text-warning" />
                                Recommended App Translations (Top 3 Languages)
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                High-quality, royalty-free translations curated for Christian devotionals, daily prayer, and mobile scripture reading.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {CURATED_TRANSLATIONS.map((t: CuratedTranslation) => {
                                const isSynced = syncedCodes.has(t.id.toUpperCase())
                                const isSyncing = syncingSet.has(t.id) || syncingCode === t.id
                                const syncedVersion = syncedVersions.find(
                                    (v) => v.code.toUpperCase() === t.id.toUpperCase(),
                                )

                                return (
                                    <Card
                                        key={t.id}
                                        className={`transition-all border ${
                                            isSynced
                                                ? 'border-success/30 bg-success/5'
                                                : 'border-border/60 hover:border-border'
                                        }`}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl" title={t.language}>
                                                        {t.languageFlag}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {t.language}
                                                    </Badge>
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {t.id}
                                                    </Badge>
                                                </div>
                                                {isSynced && (
                                                    <Badge variant="default" className="gap-1 text-xs">
                                                        <CheckCircle2 className="size-3" /> Synced
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-base font-semibold mt-2">
                                                {t.name}
                                            </CardTitle>
                                            <Badge
                                                variant="secondary"
                                                className={`w-fit text-[11px] font-normal mt-0.5 ${
                                                    t.recommendedDefault
                                                        ? 'border-warning/30 bg-warning/10 text-warning'
                                                        : ''
                                                }`}
                                            >
                                                {t.tag}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <CardDescription className="text-xs line-clamp-2">
                                                {t.description}
                                            </CardDescription>

                                            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                                                {isSynced && syncedVersion ? (
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            id={`toggle-${t.id}`}
                                                            checked={syncedVersion.isActive !== false}
                                                            onCheckedChange={() =>
                                                                onToggleVersion(syncedVersion.id)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`toggle-${t.id}`}
                                                            className="text-xs text-muted-foreground cursor-pointer select-none"
                                                        >
                                                            {syncedVersion.isActive !== false
                                                                ? 'Active on Mobile'
                                                                : 'Hidden on Mobile'}
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Not in database yet
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-1.5">
                                                    {isSynced && syncedVersion && (
                                                        <TrashConfirm
                                                            title="Delete Translation"
                                                            name={`${t.name} (${t.id})`}
                                                            description="Are you sure you want to permanently delete"
                                                            onConfirm={() => onDeleteVersion(syncedVersion.id)}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                title="Delete translation from database"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </TrashConfirm>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant={isSynced ? 'outline' : 'default'}
                                                        disabled={isSyncing}
                                                        onClick={() => handleSync(t.id)}
                                                        className="gap-1.5"
                                                    >
                                                        {isSyncing ? (
                                                            <>
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                                Syncing...
                                                            </>
                                                        ) : isSynced ? (
                                                            <>
                                                                <RefreshCw className="size-3.5" />
                                                                Re-sync
                                                            </>
                                                        ) : (
                                                            <>
                                                                <BookOpen className="size-3.5" />
                                                                1-Click Sync
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Active Synced Versions Table */}
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    All Synced Versions in Database ({syncedVersions.length})
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    These translations are available in your Postgres database and can be toggled active or hidden for the mobile app.
                                </p>
                            </div>
                        </div>

                        {loadingSynced ? (
                            <div className="flex items-center justify-center p-12 bg-card rounded-lg border border-border">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                        ) : syncedVersions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border space-y-3">
                                <div className="p-3 bg-muted rounded-full">
                                    <BookOpen className="size-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold text-foreground">No Bible Versions Synced Yet</h4>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    Click <strong>1-Click Sync</strong> on the Berean Standard Bible (BSB) card above to import your first translation.
                                </p>
                                <Button
                                    onClick={() => handleSync('BSB')}
                                    disabled={syncingCode === 'BSB'}
                                    className="gap-2 mt-2"
                                >
                                    <Sparkles className="size-4" />
                                    Sync Berean Standard Bible (BSB)
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {syncedVersions.map((v) => (
                                    <div
                                        key={v.id}
                                        className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {v.code}
                                                </Badge>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={v.isActive !== false}
                                                        onCheckedChange={() => onToggleVersion(v.id)}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {v.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className="font-semibold text-sm text-foreground pt-1">
                                                {v.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                Language: {v.language || 'English'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-border flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    onSelectVersionCode(v.code)
                                                    onTabChange('explorer')
                                                }}
                                                className="text-xs text-primary gap-1 p-0 h-auto font-medium hover:bg-transparent"
                                            >
                                                Explore Books
                                                <ChevronRight className="size-3.5" />
                                            </Button>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={syncingCode === v.code}
                                                    onClick={() => handleSync(v.code)}
                                                    className="text-xs h-7 gap-1"
                                                >
                                                    <RefreshCw className="size-3" />
                                                    Re-sync
                                                </Button>

                                                <TrashConfirm
                                                    title="Delete Translation"
                                                    name={`${v.name} (${v.code})`}
                                                    description="Are you sure you want to permanently delete"
                                                    onConfirm={() => onDeleteVersion(v.id)}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        title="Delete translation from database"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </TrashConfirm>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ── TAB 2: BOOK EXPLORER (APP MIRROR) ─────────────────────────── */}
                <TabsContent value="explorer" className="space-y-6">
                    {syncedVersions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-lg border border-border space-y-3">
                            <BookOpen className="size-8 text-muted-foreground" />
                            <h4 className="font-semibold text-foreground">No Translations Synced</h4>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Please sync at least one translation in the "App Translations" tab to browse canonical books and chapter scripture.
                            </p>
                            <Button onClick={() => onTabChange('curated')}>
                                Go to Quick-Setup
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Version Selector, Testament Tabs & Filter Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                                            Translation:
                                        </span>
                                        <Select
                                            value={selectedVersionCode}
                                            onValueChange={onSelectVersionCode}
                                        >
                                            <SelectTrigger className="w-[230px]">
                                                <SelectValue placeholder="Select Version" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {syncedVersions.map((v) => (
                                                    <SelectItem key={v.code} value={v.code}>
                                                        {v.name} ({v.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Testament Tabs Matching Mobile (Screen 1) with Live Counts */}
                                    <div className="flex items-center p-1 bg-muted rounded-lg border border-border">
                                        <Button
                                            size="sm"
                                            variant={testamentFilter === 'ALL' ? 'default' : 'ghost'}
                                            onClick={() => setTestamentFilter('ALL')}
                                            className="h-7 text-xs rounded-md gap-1.5"
                                        >
                                            All (66)
                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                                                {totalSyncedCount} synced
                                            </Badge>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={testamentFilter === 'OLD' ? 'default' : 'ghost'}
                                            onClick={() => setTestamentFilter('OLD')}
                                            className="h-7 text-xs rounded-md gap-1.5"
                                        >
                                            Old Testament (39)
                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                                                {otSyncedCount}/39
                                            </Badge>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={testamentFilter === 'NEW' ? 'default' : 'ghost'}
                                            onClick={() => setTestamentFilter('NEW')}
                                            className="h-7 text-xs rounded-md gap-1.5"
                                        >
                                            New Testament (27)
                                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
                                                {ntSyncedCount}/27
                                            </Badge>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Sync Status Filter */}
                                    <Select
                                        value={syncFilter}
                                        onValueChange={(val: any) => setSyncFilter(val)}
                                    >
                                        <SelectTrigger className="w-[150px] h-9 text-xs">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Status (66)</SelectItem>
                                            <SelectItem value="SYNCED">Synced ({totalSyncedCount})</SelectItem>
                                            <SelectItem value="UNSYNCED">Not Synced ({66 - totalSyncedCount})</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Book Search */}
                                    <div className="w-full sm:w-56">
                                        <SearchInput
                                            placeholder="Search books..."
                                            value={bookSearchQuery}
                                            onValueChange={(val) => setBookSearchQuery(val)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contextual Action / Status Banner */}
                            {testamentFilter === 'NEW' && ntSyncedCount < 27 && (
                                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Sparkles className="size-4 text-primary shrink-0" />
                                        <span className="text-xs text-foreground">
                                            <strong>New Testament:</strong> {ntSyncedCount} of 27 books currently synced in {selectedVersionCode}.
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={syncingCode === selectedVersionCode}
                                        onClick={() => handleSync(selectedVersionCode, { testament: 'NEW' })}
                                        className="h-8 text-xs gap-1.5 shrink-0"
                                    >
                                        <CloudDownload className="size-3.5" />
                                        Sync All 27 New Testament Books
                                    </Button>
                                </div>
                            )}

                            {testamentFilter === 'OLD' && otSyncedCount < 39 && (
                                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Sparkles className="size-4 text-primary shrink-0" />
                                        <span className="text-xs text-foreground">
                                            <strong>Old Testament:</strong> {otSyncedCount} of 39 books currently synced in {selectedVersionCode}.
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={syncingCode === selectedVersionCode}
                                        onClick={() => handleSync(selectedVersionCode, { testament: 'OLD' })}
                                        className="h-8 text-xs gap-1.5 shrink-0"
                                    >
                                        <CloudDownload className="size-3.5" />
                                        Sync Remaining Old Testament Books
                                    </Button>
                                </div>
                            )}

                            {testamentFilter === 'ALL' && totalSyncedCount < 66 && (
                                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Sparkles className="size-4 text-primary shrink-0" />
                                        <span className="text-xs text-foreground">
                                            <strong>Canonical Overview:</strong> {totalSyncedCount} of 66 Christian books synced in {selectedVersionCode}.
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={syncingCode === selectedVersionCode}
                                        onClick={() => handleSync(selectedVersionCode)}
                                        className="h-8 text-xs gap-1.5 shrink-0"
                                    >
                                        <CloudDownload className="size-3.5" />
                                        Sync All 66 Books
                                    </Button>
                                </div>
                            )}

                            {/* Canonical 66 Books Grid */}
                            {loadingBooks ? (
                                <div className="flex items-center justify-center p-16 bg-card rounded-lg border border-border">
                                    <Loader2 className="size-8 animate-spin text-primary" />
                                </div>
                            ) : filteredCanonicalBooks.length === 0 ? (
                                <div className="p-12 text-center bg-card rounded-lg border border-border text-sm text-muted-foreground">
                                    No books match your search or filter.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredCanonicalBooks.map((b) => (
                                        <div
                                            key={b.canonical.id}
                                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                                                b.isSynced
                                                    ? 'bg-card border-border/80 hover:border-primary/50 hover:shadow-sm'
                                                    : 'bg-muted/20 border-dashed border-border/70 opacity-90 hover:opacity-100 hover:border-primary/40'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-mono text-muted-foreground">
                                                            #{b.bookNumber}
                                                        </span>
                                                        <span className="text-[10px] font-mono uppercase text-muted-foreground/80">
                                                            ({b.canonical.id})
                                                        </span>
                                                    </div>
                                                    <h4
                                                        onClick={() => {
                                                            if (b.isSynced) onOpenBookChapters(b.slug)
                                                        }}
                                                        className={`font-semibold text-base pt-0.5 ${
                                                            b.isSynced
                                                                ? 'text-foreground hover:text-primary cursor-pointer'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {b.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Badge
                                                        variant={b.testament === 'OLD' ? 'secondary' : 'outline'}
                                                        className="text-[10px] font-semibold"
                                                    >
                                                        {b.testament === 'OLD' ? 'OT' : 'NT'}
                                                    </Badge>
                                                    {b.isSynced ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] bg-success/10 text-success border-success/20 font-medium"
                                                        >
                                                            Synced
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] text-muted-foreground bg-muted"
                                                        >
                                                            Not Synced
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Row */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                                                {b.isSynced ? (
                                                    <>
                                                        <span>
                                                            {b.chapterCount} Ch · {b.totalVerses.toLocaleString()} V
                                                        </span>
                                                        <div className="flex items-center gap-1 font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px]">
                                                            <MessageSquare className="size-3" />
                                                            <span>{b.discussionsCount.toLocaleString()}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground/80">
                                                        {b.chapterCount} Chapters (Canonical)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions Row */}
                                            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                                                {b.isSynced ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onOpenBookChapters(b.slug)}
                                                            className="h-7 text-xs text-primary gap-1 p-0 hover:bg-transparent font-medium"
                                                        >
                                                            Explore Chapters
                                                            <ChevronRight className="size-3.5" />
                                                        </Button>

                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-7"
                                                                disabled={syncingCode === selectedVersionCode}
                                                                onClick={() =>
                                                                    handleSync(selectedVersionCode, {
                                                                        bookIds: [b.canonical.id],
                                                                    })
                                                                }
                                                                title="Re-sync this book"
                                                            >
                                                                <RefreshCw className="size-3" />
                                                            </Button>
                                                            <TrashConfirm
                                                                title="Delete Book"
                                                                name={`${b.name}`}
                                                                description={`Are you sure you want to remove ${b.name} from ${selectedVersionCode}?`}
                                                                onConfirm={() =>
                                                                    onDeleteBook(selectedVersionCode, b.slug)
                                                                }
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    title="Delete book from database"
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </Button>
                                                            </TrashConfirm>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs h-7.5 gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/5"
                                                        disabled={syncingCode === selectedVersionCode}
                                                        onClick={() =>
                                                            handleSync(selectedVersionCode, {
                                                                bookIds: [b.canonical.id],
                                                            })
                                                        }
                                                    >
                                                        <CloudDownload className="size-3.5" />
                                                        1-Click Sync Book
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* ── TAB 3: FULL ARCHIVE CATALOGUE ─────────────────────────────── */}
                <TabsContent value="catalog" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Search by name, ID or language..."
                                value={searchQuery}
                                onValueChange={onSearchChange}
                            />
                        </div>
                        <Select
                            value={language || 'ALL'}
                            onValueChange={(val) => onLanguageChange(val === 'ALL' ? '' : val)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Languages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Languages</SelectItem>
                                {languageOptions.map((lang) => (
                                    <SelectItem key={lang} value={lang}>
                                        {lang}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DataTable
                        columns={availableColumns}
                        data={paginatedAvailable}
                        loading={loadingAvailable}
                        noun="translations"
                        page={availablePage}
                        limit={availableLimit}
                        total={filteredAvailable.length}
                        onReset={onResetSearch}
                    />
                </TabsContent>
            </Tabs>

            {/* ── LIVE SYNC PROGRESS DIALOG ─────────────────────────────────────── */}
            <Dialog open={!!syncingCode} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <RefreshCw className="size-4 animate-spin text-primary" />
                            Syncing Bible Translation: {syncingCode}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Fetching complete canonical scripture from bible.helloao.org and indexing verses into your database...
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">
                                    {syncStatus?.recordsProcessed
                                        ? `${syncStatus.recordsProcessed.toLocaleString()} verses imported`
                                        : 'Initializing download...'}
                                </span>
                                <span className="font-semibold text-primary">
                                    {syncStatus?.percentage ?? 15}%
                                </span>
                            </div>
                            <Progress value={syncStatus?.percentage ?? 15} />
                        </div>

                        {/* Status readout */}
                        <div className="p-3 bg-muted/60 rounded-lg text-xs space-y-2 border border-border/50">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant="outline" className="text-[11px] gap-1 animate-pulse">
                                    <Loader2 className="size-2.5 animate-spin" />
                                    {syncStatus?.status ?? 'DOWNLOADING'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Estimated Content:</span>
                                <span className="font-medium text-foreground">66 Books · ~31,087 Verses</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── CHAPTER SELECTOR MODAL (SCREEN 2) ────────────────────────────── */}
            <Dialog
                open={!!selectedBookChapters}
                onOpenChange={(open) => {
                    if (!open) onCloseBookChapters()
                }}
            >
                <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center justify-between pr-6">
                            <span>{selectedBookChapters?.book.name}</span>
                            <Badge variant="outline">
                                {selectedBookChapters?.book.testament === 'OLD' ? 'Old Testament' : 'New Testament'}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            {selectedBookChapters?.book.chapterCount} Chapters · {selectedBookChapters?.book.totalVerses.toLocaleString()} Total Verses
                        </DialogDescription>
                    </DialogHeader>

                    {loadingChapters ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-1 py-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {selectedBookChapters?.chapters.map((ch) => (
                                    <div
                                        key={ch.id}
                                        onClick={() =>
                                            onOpenChapterDetail(
                                                selectedBookChapters.book.slug,
                                                ch.chapterNumber,
                                            )
                                        }
                                        className="group p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm group-hover:text-primary">
                                                Ch. {ch.chapterNumber}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {ch.numberOfVerses} v
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-primary">
                                            <MessageSquare className="size-3" />
                                            <span>{ch.discussionsCount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── CHAPTER SCRIPTURE READER MODAL (SCREEN 3) ────────────────────── */}
            <Dialog
                open={!!selectedChapterDetail}
                onOpenChange={(open) => {
                    if (!open) onCloseChapterDetail()
                }}
            >
                <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader className="border-b border-border pb-3">
                        <div className="flex items-center justify-between pr-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCloseChapterDetail}
                                className="h-8 gap-1.5 text-xs -ml-2"
                            >
                                <ArrowLeft className="size-3.5" />
                                Back to Chapters
                            </Button>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {selectedChapterDetail?.version.code}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl pt-2">
                            {selectedChapterDetail?.book.name} {selectedChapterDetail?.chapter.number}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-3 text-xs">
                            <span>{selectedChapterDetail?.chapter.numberOfVerses} Verses</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-primary font-medium">
                                <MessageSquare className="size-3" />
                                {selectedChapterDetail?.chapter.discussionsCount.toLocaleString()} Community Notes
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    {loadingChapterDetail ? (
                        <div className="flex items-center justify-center p-16">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-3 text-sm leading-relaxed font-serif">
                            {selectedChapterDetail?.verses.map((v) => (
                                <p key={v.id} className="text-foreground hover:bg-muted/40 p-1.5 rounded transition-colors">
                                    <span className="font-sans font-bold text-xs text-primary mr-2 select-none">
                                        {v.number}
                                    </span>
                                    <span>{v.text}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
