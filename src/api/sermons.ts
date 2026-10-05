import { request, toQuery } from '@/api/base'

export type SermonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** Language of a sermon's content projection: en (canonical) | esp | por. */
export type SermonLanguage = 'en' | 'esp' | 'por'

export type SermonTopic = {
    id: string
    name: string
    slug: string
}

/** Per-language content block (esp/por rows; en mirrors the base fields). */
export type SermonTranslation = {
    language: SermonLanguage
    title: string
    overview: string | null
    thumbnailUrl: string | null
    youtubeUrl: string | null
    topics: SermonTopic[]
}

export type Sermon = {
    id: string
    title: string
    overview: string | null
    thumbnailUrl: string | null
    youtubeUrl: string | null
    status: SermonStatus
    topics: SermonTopic[]
    /** Language of the top-level title/overview/video in this response. */
    language: SermonLanguage
    /** Every other language's content, always present. */
    translations: SermonTranslation[]
    likesCount: number
    commentsCount: number
    viewsCount: number
    sharesCount: number
    isLiked: boolean
    isSaved: boolean
    publishedAt: string | null
    createdAt: string
    timeAgo: string
}

/** Per-language form block sent to the API. Empty title on update = delete that translation. */
export type SermonTranslationInput = {
    language: SermonLanguage
    title?: string
    overview?: string
    thumbnailUrl?: string
    youtubeUrl?: string
}

export type SermonInput = {
    title: string
    overview?: string
    thumbnailUrl?: string
    youtubeUrl: string
    status?: SermonStatus
    translations?: SermonTranslationInput[]
}

export type PaginatedSermons = {
    data: Sermon[]
    page: number
    limit: number
    total: number
}

/**
 * Admin-aware listing: without a status filter the API returns the
 * PUBLISHED feed; pass DRAFT/PUBLISHED/ARCHIVED/ALL (admin only) to
 * manage non-published sermons. `language` (en|esp|por) filters sermons
 * that have that language's content (en/default matches all).
 */
export function listSermons(params: { page?: number; limit?: number; status?: SermonStatus | 'ALL'; language?: SermonLanguage } = {}) {
    return request<PaginatedSermons>(`/sermons${toQuery(params)}`)
}

/** Detail fetch — the list response already carries every translation, so this is for direct/refresh cases. */
export function getSermon(id: string) {
    return request<Sermon>(`/sermons/${id}`)
}

export function createSermon(input: SermonInput) {
    return request<Sermon>('/sermons', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function updateSermon(id: string, input: Partial<SermonInput>) {
    return request<Sermon>(`/sermons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

/** Admin soft delete (sets deletedAt; hidden from feeds). */
export function deleteSermon(id: string) {
    return request<{ message: string }>(`/sermons/${id}`, { method: 'DELETE' })
}
