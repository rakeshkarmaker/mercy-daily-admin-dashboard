import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { BibleVersionsUI } from '@/components/features/bible/bible-versions-ui'
import {
    deleteBibleBook,
    deleteBibleVersion,
    getAdminVersions,
    getAvailableTranslations,
    getBookChapters,
    getChapterDetail,
    getLatestSyncStatus,
    getVersionBooks,
    syncBibleVersion,
    toggleBibleVersion,
} from '@/api/bible'
import type { BookChaptersResponse, ChapterDetailResponse } from '@/api/bible'

const searchSchema = z.object({
    tab: z.enum(['curated', 'explorer', 'catalog', 'available', 'synced']).catch('curated').optional(),
    language: z.string().catch('').optional(),
    search: z.string().catch('').optional(),
    version: z.string().catch('').optional(),
    page: z.number().catch(1).optional(),
    limit: z.number().catch(20).optional(),
})

export const Route = createFileRoute('/__main/bible-versions')({
    validateSearch: searchSchema,
    component: BibleVersionsPage,
})

function BibleVersionsPage() {
    const search = Route.useSearch()
    const rawTab = search.tab ?? 'curated'
    // Normalize legacy tabs to new structure
    const tab = rawTab === 'available' ? 'catalog' : rawTab === 'synced' ? 'curated' : rawTab
    const language = search.language ?? ''
    const searchQuery = search.search ?? ''
    const page = search.page ?? 1
    const limit = search.limit ?? 20

    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    // Modals state for chapters and reader
    const [selectedBookChapters, setSelectedBookChapters] = useState<BookChaptersResponse | null>(null)
    const [loadingChapters, setLoadingChapters] = useState(false)

    const [selectedChapterDetail, setSelectedChapterDetail] = useState<ChapterDetailResponse | null>(null)
    const [loadingChapterDetail, setLoadingChapterDetail] = useState(false)

    // HelloAO Catalogue
    const { data: availableData, isLoading: loadingAvailable } = useQuery({
        queryKey: ['bible-available-translations'],
        queryFn: getAvailableTranslations,
        staleTime: 10 * 60 * 1000,
    })

    // Synced versions from Database (with isActive status)
    const { data: syncedVersions = [], isLoading: loadingSynced } = useQuery({
        queryKey: ['bible-synced-versions'],
        queryFn: getAdminVersions,
    })

    const availableTranslations = useMemo(
        () => availableData?.translations ?? [],
        [availableData],
    )

    // Current version for the Book Explorer
    const selectedVersionCode = useMemo(() => {
        if (search.version && syncedVersions.some((v) => v.code.toUpperCase() === search.version?.toUpperCase())) {
            return search.version.toUpperCase()
        }
        return syncedVersions[0]?.code ?? 'BSB'
    }, [search.version, syncedVersions])

    // Query books for the selected version
    const { data: booksResponse, isLoading: loadingBooks } = useQuery({
        queryKey: ['bible-version-books', selectedVersionCode],
        queryFn: () => getVersionBooks(selectedVersionCode),
        enabled: !!selectedVersionCode && syncedVersions.length > 0,
    })

    const books = useMemo(() => booksResponse?.books ?? [], [booksResponse])

    // Track active sync job
    const [activeSyncCode, setActiveSyncCode] = useState<string | null>(null)

    // Poll sync progress when an active sync is running
    const { data: syncStatus } = useQuery({
        queryKey: ['bible-sync-status', activeSyncCode],
        queryFn: () => getLatestSyncStatus(activeSyncCode ?? undefined),
        enabled: !!activeSyncCode,
        refetchInterval: activeSyncCode ? 1200 : false,
    })

    // Sync mutation
    const syncMutation = useMutation({
        mutationFn: ({
            code,
            options,
        }: {
            code: string
            options?: { bookIds?: string[]; testament?: 'OLD' | 'NEW' }
        }) => {
            setActiveSyncCode(code)
            return syncBibleVersion(code, options)
        },
        onSuccess: (result) => {
            setActiveSyncCode(null)
            toast.success(
                `Synced ${result.version}: ${result.recordsProcessed.toLocaleString()} verses imported`,
            )
            queryClient.invalidateQueries({ queryKey: ['bible-synced-versions'] })
            queryClient.invalidateQueries({ queryKey: ['bible-version-books'] })
        },
        onError: (error: Error) => {
            setActiveSyncCode(null)
            toast.error(error.message)
        },
    })

    // Delete version mutation
    const deleteVersionMutation = useMutation({
        mutationFn: (id: number) => deleteBibleVersion(id),
        onSuccess: (result) => {
            toast.success(result.message || 'Translation removed from database')
            queryClient.invalidateQueries({ queryKey: ['bible-synced-versions'] })
            queryClient.invalidateQueries({ queryKey: ['bible-version-books'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    // Delete book mutation
    const deleteBookMutation = useMutation({
        mutationFn: ({
            versionCode,
            bookSlug,
        }: {
            versionCode: string
            bookSlug: string
        }) => deleteBibleBook(versionCode, bookSlug),
        onSuccess: (result) => {
            toast.success(result.message || 'Book removed from database')
            queryClient.invalidateQueries({ queryKey: ['bible-version-books'] })
            queryClient.invalidateQueries({ queryKey: ['bible-synced-versions'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    // Toggle active status mutation
    const toggleMutation = useMutation({
        mutationFn: (id: number) => toggleBibleVersion(id),
        onSuccess: (result) => {
            toast.success(
                `${result.name} is now ${result.isActive ? 'Active on mobile' : 'Hidden on mobile'}`,
            )
            queryClient.invalidateQueries({ queryKey: ['bible-synced-versions'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    // Open chapter list for a book
    const handleOpenBookChapters = async (bookSlug: string) => {
        setLoadingChapters(true)
        setSelectedBookChapters({
            version: { id: 0, code: selectedVersionCode, name: selectedVersionCode },
            book: {
                id: 0,
                name: bookSlug,
                slug: bookSlug,
                testament: 'OLD',
                bookNumber: 0,
                chapterCount: 0,
                totalVerses: 0,
                discussionsCount: 0,
            },
            chapters: [],
        })
        try {
            const data = await getBookChapters(selectedVersionCode, bookSlug)
            setSelectedBookChapters(data)
        } catch (err: any) {
            toast.error(err.message || 'Failed to load chapters')
            setSelectedBookChapters(null)
        } finally {
            setLoadingChapters(false)
        }
    }

    // Open chapter reader detail
    const handleOpenChapterDetail = async (bookSlug: string, chapterNumber: number) => {
        setLoadingChapterDetail(true)
        setSelectedChapterDetail({
            version: { code: selectedVersionCode, name: selectedVersionCode, language: 'eng' },
            book: { id: 0, name: bookSlug, slug: bookSlug, testament: 'OLD', bookNumber: 0, chapterCount: 0 },
            chapter: { id: 0, number: chapterNumber, numberOfVerses: 0, discussionsCount: 0 },
            verses: [],
        })
        try {
            const data = await getChapterDetail(selectedVersionCode, bookSlug, chapterNumber)
            setSelectedChapterDetail(data)
        } catch (err: any) {
            toast.error(err.message || 'Failed to load chapter text')
            setSelectedChapterDetail(null)
        } finally {
            setLoadingChapterDetail(false)
        }
    }

    return (
        <BibleVersionsUI
            availableTranslations={availableTranslations}
            syncedVersions={syncedVersions}
            loadingAvailable={loadingAvailable}
            loadingSynced={loadingSynced}
            syncingCode={activeSyncCode}
            syncStatus={syncStatus}
            tab={tab}
            language={language}
            searchQuery={searchQuery}
            availablePage={page}
            availableLimit={limit}
            selectedVersionCode={selectedVersionCode}
            books={books}
            loadingBooks={loadingBooks}
            selectedBookChapters={selectedBookChapters}
            loadingChapters={loadingChapters}
            selectedChapterDetail={selectedChapterDetail}
            loadingChapterDetail={loadingChapterDetail}
            onTabChange={(t) => mergeSearch({ tab: t, page: 1 })}
            onLanguageChange={(lang) => mergeSearch({ language: lang || undefined, page: 1 })}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() =>
                mergeSearch({ search: undefined, language: undefined, page: 1 })
            }
            onSelectVersionCode={(code) => mergeSearch({ version: code })}
            onSyncVersion={(code, options) =>
                syncMutation.mutateAsync({ code, options }).then(() => undefined)
            }
            onDeleteVersion={(id) => deleteVersionMutation.mutateAsync(id).then(() => undefined)}
            onDeleteBook={(versionCode, bookSlug) =>
                deleteBookMutation.mutateAsync({ versionCode, bookSlug }).then(() => undefined)
            }
            onToggleVersion={(id) => toggleMutation.mutateAsync(id).then(() => undefined)}
            onOpenBookChapters={handleOpenBookChapters}
            onCloseBookChapters={() => setSelectedBookChapters(null)}
            onOpenChapterDetail={handleOpenChapterDetail}
            onCloseChapterDetail={() => setSelectedChapterDetail(null)}
        />
    )
}
