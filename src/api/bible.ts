import { request } from '@/api/base'

// ── Types ──────────────────────────────────────────────────────────────────

export type AvailableTranslation = {
    id: string
    name: string
    language: string
    textDirection: 'ltr' | 'rtl'
    numberOfBooks?: number
}

export type AvailableTranslationsResponse = {
    total: number
    translations: AvailableTranslation[]
}

export type SyncedVersion = {
    id: number
    code: string
    name: string
    language: string | null
    licenseUrl: string | null
    isActive?: boolean
}

export type BookDetail = {
    id: number
    name: string
    slug: string
    testament: 'OLD' | 'NEW'
    bookNumber: number
    chapterCount: number
    totalVerses: number
    discussionsCount: number
}

export type BooksResponse = {
    id: number
    code: string
    name: string
    language: string | null
    books: BookDetail[]
}

export type ChapterSummary = {
    id: number
    chapterNumber: number
    numberOfVerses: number
    discussionsCount: number
}

export type BookChaptersResponse = {
    version: { id: number; code: string; name: string }
    book: BookDetail
    chapters: ChapterSummary[]
}

export type ChapterVerse = {
    id: number
    number: number
    text: string
}

export type ChapterDetailResponse = {
    version: { code: string; name: string; language: string | null }
    book: {
        id: number
        name: string
        slug: string
        testament: 'OLD' | 'NEW'
        bookNumber: number
        chapterCount: number
    }
    chapter: {
        id: number
        number: number
        numberOfVerses: number
        discussionsCount: number
    }
    verses: ChapterVerse[]
}

export type SyncStatusResponse = {
    id: string
    versionId: number
    versionCode: string
    versionName: string
    status: 'RUNNING' | 'COMPLETED' | 'FAILED'
    recordsProcessed: number
    recordsAdded: number
    recordsUpdated: number
    totalEstimated: number
    percentage: number
    startedAt: string
    completedAt: string | null
    errorMessage: string | null
}

export type CuratedTranslation = {
    id: string
    name: string
    language: string
    languageCode: 'en' | 'es' | 'pt'
    languageFlag: string
    description: string
    tag: string
    recommendedDefault?: boolean
}

// ── Curated Top Versions for Mercy Daily ───────────────────────────────────

export const CURATED_TRANSLATIONS: CuratedTranslation[] = [
    {
        id: 'BSB',
        name: 'Berean Standard Bible',
        language: 'English',
        languageCode: 'en',
        languageFlag: '🇺🇸',
        description: 'Modern, highly accurate, beautiful flow. Public domain dedication (CC0).',
        tag: 'Recommended Default',
        recommendedDefault: true,
    },
    {
        id: 'eng_kjv',
        name: 'King James Version',
        language: 'English',
        languageCode: 'en',
        languageFlag: '🇬🇧',
        description: 'The historic classic with traditional majestic prose. Loved by generations.',
        tag: 'Traditional Classic',
    },
    {
        id: 'ENGWEBP',
        name: 'World English Bible',
        language: 'English',
        languageCode: 'en',
        languageFlag: '🌐',
        description: 'Contemporary English, 100% public domain worldwide, unbiased translation.',
        tag: 'Global Standard',
    },
    {
        id: 'spa_r09',
        name: 'Santa Biblia — Reina Valera 1909',
        language: 'Spanish',
        languageCode: 'es',
        languageFlag: '🇪🇸',
        description: 'The most beloved Spanish translation in history, equivalent to the Spanish KJV.',
        tag: 'Spanish Classic',
    },
    {
        id: 'spa_onbv',
        name: 'Open Nueva Biblia Viva',
        language: 'Spanish',
        languageCode: 'es',
        languageFlag: '🇪🇸',
        description: 'Clear, modern conversational Spanish. Ideal for youth and daily devotionals.',
        tag: 'Modern Spanish',
    },
    {
        id: 'por_blj',
        name: 'Bíblia Livre',
        language: 'Portuguese',
        languageCode: 'pt',
        languageFlag: '🇧🇷',
        description: 'High accuracy and fluent modern Portuguese. 100% open access.',
        tag: 'Portuguese Standard',
    },
]

// ── API functions ──────────────────────────────────────────────────────────

/** Admin: list all translations available from HelloAO (slim payload). */
export function getAvailableTranslations() {
    return request<AvailableTranslationsResponse>('/bible/admin/translations')
}

/** Public: list all locally-synced (active) Bible versions. */
export function getSyncedVersions() {
    return request<SyncedVersion[]>('/bible/versions')
}

/** Admin: list all versions in database including inactive ones. */
export function getAdminVersions() {
    return request<SyncedVersion[]>('/bible/admin/versions')
}

/** Public / Admin: get books for a version with discussion tallies. */
export function getVersionBooks(versionCode: string) {
    return request<BooksResponse>(`/bible/${versionCode}/books`)
}

/** Public / Admin: get all chapters for a book with discussion tallies. */
export function getBookChapters(versionCode: string, bookSlug: string) {
    return request<BookChaptersResponse>(`/bible/${versionCode}/books/${bookSlug}/chapters`)
}

/** Public / Admin: get a specific chapter with verses. */
export function getChapterDetail(versionCode: string, bookSlug: string, chapterNumber: number) {
    return request<ChapterDetailResponse>(`/bible/${versionCode}/books/${bookSlug}/chapters/${chapterNumber}`)
}

export type CanonicalBook = {
    bookNumber: number
    id: string
    name: string
    slug: string
    testament: 'OLD' | 'NEW'
    expectedChapters: number
}

export const CANONICAL_BIBLE_BOOKS: CanonicalBook[] = [
    // Old Testament (39)
    { bookNumber: 1, id: 'GEN', name: 'Genesis', slug: 'genesis', testament: 'OLD', expectedChapters: 50 },
    { bookNumber: 2, id: 'EXO', name: 'Exodus', slug: 'exodus', testament: 'OLD', expectedChapters: 40 },
    { bookNumber: 3, id: 'LEV', name: 'Leviticus', slug: 'leviticus', testament: 'OLD', expectedChapters: 27 },
    { bookNumber: 4, id: 'NUM', name: 'Numbers', slug: 'numbers', testament: 'OLD', expectedChapters: 36 },
    { bookNumber: 5, id: 'DEU', name: 'Deuteronomy', slug: 'deuteronomy', testament: 'OLD', expectedChapters: 34 },
    { bookNumber: 6, id: 'JOS', name: 'Joshua', slug: 'joshua', testament: 'OLD', expectedChapters: 24 },
    { bookNumber: 7, id: 'JDG', name: 'Judges', slug: 'judges', testament: 'OLD', expectedChapters: 21 },
    { bookNumber: 8, id: 'RUT', name: 'Ruth', slug: 'ruth', testament: 'OLD', expectedChapters: 4 },
    { bookNumber: 9, id: '1SA', name: '1 Samuel', slug: '1-samuel', testament: 'OLD', expectedChapters: 31 },
    { bookNumber: 10, id: '2SA', name: '2 Samuel', slug: '2-samuel', testament: 'OLD', expectedChapters: 24 },
    { bookNumber: 11, id: '1KI', name: '1 Kings', slug: '1-kings', testament: 'OLD', expectedChapters: 22 },
    { bookNumber: 12, id: '2KI', name: '2 Kings', slug: '2-kings', testament: 'OLD', expectedChapters: 25 },
    { bookNumber: 13, id: '1CH', name: '1 Chronicles', slug: '1-chronicles', testament: 'OLD', expectedChapters: 29 },
    { bookNumber: 14, id: '2CH', name: '2 Chronicles', slug: '2-chronicles', testament: 'OLD', expectedChapters: 36 },
    { bookNumber: 15, id: 'EZR', name: 'Ezra', slug: 'ezra', testament: 'OLD', expectedChapters: 10 },
    { bookNumber: 16, id: 'NEH', name: 'Nehemiah', slug: 'nehemiah', testament: 'OLD', expectedChapters: 13 },
    { bookNumber: 17, id: 'EST', name: 'Esther', slug: 'esther', testament: 'OLD', expectedChapters: 10 },
    { bookNumber: 18, id: 'JOB', name: 'Job', slug: 'job', testament: 'OLD', expectedChapters: 42 },
    { bookNumber: 19, id: 'PSA', name: 'Psalms', slug: 'psalms', testament: 'OLD', expectedChapters: 150 },
    { bookNumber: 20, id: 'PRO', name: 'Proverbs', slug: 'proverbs', testament: 'OLD', expectedChapters: 31 },
    { bookNumber: 21, id: 'ECC', name: 'Ecclesiastes', slug: 'ecclesiastes', testament: 'OLD', expectedChapters: 12 },
    { bookNumber: 22, id: 'SNG', name: 'Song of Solomon', slug: 'song-of-solomon', testament: 'OLD', expectedChapters: 8 },
    { bookNumber: 23, id: 'ISA', name: 'Isaiah', slug: 'isaiah', testament: 'OLD', expectedChapters: 66 },
    { bookNumber: 24, id: 'JER', name: 'Jeremiah', slug: 'jeremiah', testament: 'OLD', expectedChapters: 52 },
    { bookNumber: 25, id: 'LAM', name: 'Lamentations', slug: 'lamentations', testament: 'OLD', expectedChapters: 5 },
    { bookNumber: 26, id: 'EZK', name: 'Ezekiel', slug: 'ezekiel', testament: 'OLD', expectedChapters: 48 },
    { bookNumber: 27, id: 'DAN', name: 'Daniel', slug: 'daniel', testament: 'OLD', expectedChapters: 12 },
    { bookNumber: 28, id: 'HOS', name: 'Hosea', slug: 'hosea', testament: 'OLD', expectedChapters: 14 },
    { bookNumber: 29, id: 'JOL', name: 'Joel', slug: 'joel', testament: 'OLD', expectedChapters: 3 },
    { bookNumber: 30, id: 'AMO', name: 'Amos', slug: 'amos', testament: 'OLD', expectedChapters: 9 },
    { bookNumber: 31, id: 'OBA', name: 'Obadiah', slug: 'obadiah', testament: 'OLD', expectedChapters: 1 },
    { bookNumber: 32, id: 'JON', name: 'Jonah', slug: 'jonah', testament: 'OLD', expectedChapters: 4 },
    { bookNumber: 33, id: 'MIC', name: 'Micah', slug: 'micah', testament: 'OLD', expectedChapters: 7 },
    { bookNumber: 34, id: 'NAM', name: 'Nahum', slug: 'nahum', testament: 'OLD', expectedChapters: 3 },
    { bookNumber: 35, id: 'HAB', name: 'Habakkuk', slug: 'habakkuk', testament: 'OLD', expectedChapters: 3 },
    { bookNumber: 36, id: 'ZEP', name: 'Zephaniah', slug: 'zephaniah', testament: 'OLD', expectedChapters: 3 },
    { bookNumber: 37, id: 'HAG', name: 'Haggai', slug: 'haggai', testament: 'OLD', expectedChapters: 2 },
    { bookNumber: 38, id: 'ZEC', name: 'Zechariah', slug: 'zechariah', testament: 'OLD', expectedChapters: 14 },
    { bookNumber: 39, id: 'MAL', name: 'Malachi', slug: 'malachi', testament: 'OLD', expectedChapters: 4 },

    // New Testament (27)
    { bookNumber: 40, id: 'MAT', name: 'Matthew', slug: 'matthew', testament: 'NEW', expectedChapters: 28 },
    { bookNumber: 41, id: 'MRK', name: 'Mark', slug: 'mark', testament: 'NEW', expectedChapters: 16 },
    { bookNumber: 42, id: 'LUK', name: 'Luke', slug: 'luke', testament: 'NEW', expectedChapters: 24 },
    { bookNumber: 43, id: 'JHN', name: 'John', slug: 'john', testament: 'NEW', expectedChapters: 21 },
    { bookNumber: 44, id: 'ACT', name: 'Acts', slug: 'acts', testament: 'NEW', expectedChapters: 28 },
    { bookNumber: 45, id: 'ROM', name: 'Romans', slug: 'romans', testament: 'NEW', expectedChapters: 16 },
    { bookNumber: 46, id: '1CO', name: '1 Corinthians', slug: '1-corinthians', testament: 'NEW', expectedChapters: 16 },
    { bookNumber: 47, id: '2CO', name: '2 Corinthians', slug: '2-corinthians', testament: 'NEW', expectedChapters: 13 },
    { bookNumber: 48, id: 'GAL', name: 'Galatians', slug: 'galatians', testament: 'NEW', expectedChapters: 6 },
    { bookNumber: 49, id: 'EPH', name: 'Ephesians', slug: 'ephesians', testament: 'NEW', expectedChapters: 6 },
    { bookNumber: 50, id: 'PHP', name: 'Philippians', slug: 'philippians', testament: 'NEW', expectedChapters: 4 },
    { bookNumber: 51, id: 'COL', name: 'Colossians', slug: 'colossians', testament: 'NEW', expectedChapters: 4 },
    { bookNumber: 52, id: '1TH', name: '1 Thessalonians', slug: '1-thessalonians', testament: 'NEW', expectedChapters: 5 },
    { bookNumber: 53, id: '2TH', name: '2 Thessalonians', slug: '2-thessalonians', testament: 'NEW', expectedChapters: 3 },
    { bookNumber: 54, id: '1TI', name: '1 Timothy', slug: '1-timothy', testament: 'NEW', expectedChapters: 6 },
    { bookNumber: 55, id: '2TI', name: '2 Timothy', slug: '2-timothy', testament: 'NEW', expectedChapters: 4 },
    { bookNumber: 56, id: 'TIT', name: 'Titus', slug: 'titus', testament: 'NEW', expectedChapters: 3 },
    { bookNumber: 57, id: 'PHM', name: 'Philemon', slug: 'philemon', testament: 'NEW', expectedChapters: 1 },
    { bookNumber: 58, id: 'HEB', name: 'Hebrews', slug: 'hebrews', testament: 'NEW', expectedChapters: 13 },
    { bookNumber: 59, id: 'JAS', name: 'James', slug: 'james', testament: 'NEW', expectedChapters: 5 },
    { bookNumber: 60, id: '1PE', name: '1 Peter', slug: '1-peter', testament: 'NEW', expectedChapters: 5 },
    { bookNumber: 61, id: '2PE', name: '2 Peter', slug: '2-peter', testament: 'NEW', expectedChapters: 3 },
    { bookNumber: 62, id: '1JN', name: '1 John', slug: '1-john', testament: 'NEW', expectedChapters: 5 },
    { bookNumber: 63, id: '2JN', name: '2 John', slug: '2-john', testament: 'NEW', expectedChapters: 1 },
    { bookNumber: 64, id: '3JN', name: '3 John', slug: '3-john', testament: 'NEW', expectedChapters: 1 },
    { bookNumber: 65, id: 'JUD', name: 'Jude', slug: 'jude', testament: 'NEW', expectedChapters: 1 },
    { bookNumber: 66, id: 'REV', name: 'Revelation', slug: 'revelation', testament: 'NEW', expectedChapters: 22 },
]

/** Admin: trigger a sync for a translation or selective books by HelloAO code. */
export function syncBibleVersion(
    versionCode: string,
    options?: { bookIds?: string[]; testament?: 'OLD' | 'NEW' },
) {
    return request<{
        success: boolean
        version: string
        status: string
        recordsProcessed: number
        recordsAdded: number
        recordsUpdated: number
    }>(`/bible/admin/sync/${versionCode}`, {
        method: 'POST',
        body: JSON.stringify(options ?? {}),
    })
}

/** Admin: toggle active status of a synced Bible version. */
export function toggleBibleVersion(id: number) {
    return request<{
        id: number
        code: string
        name: string
        isActive: boolean
    }>(`/bible/admin/versions/${id}/toggle`, {
        method: 'PATCH',
    })
}

/** Admin: permanently delete a Bible translation and all its contents from database. */
export function deleteBibleVersion(id: number) {
    return request<{
        success: boolean
        message: string
        deletedVersionId: number
    }>(`/bible/admin/versions/${id}`, {
        method: 'DELETE',
    })
}

/** Admin: permanently delete an individual book and its chapters/verses from database. */
export function deleteBibleBook(versionCode: string, bookSlug: string) {
    return request<{
        success: boolean
        message: string
        deletedBookId: number
    }>(`/bible/admin/versions/${versionCode}/books/${bookSlug}`, {
        method: 'DELETE',
    })
}

/** Admin: get latest sync status with percentage and progress. */
export function getLatestSyncStatus(versionCode?: string) {
    const query = versionCode ? `?versionCode=${encodeURIComponent(versionCode)}` : ''
    return request<SyncStatusResponse | null>(`/bible/admin/sync/latest${query}`)
}

