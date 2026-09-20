import { request, toQuery } from '@/api/base'

export type SermonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type SermonTopic = {
    id: string
    name: string
    slug: string
}

export type Sermon = {
    id: string
    title: string
    overview: string | null
    thumbnailUrl: string | null
    youtubeUrl: string | null
    durationSec: number | null
    status: SermonStatus
    topics: SermonTopic[]
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

export type SermonInput = {
    title: string
    overview?: string
    thumbnailUrl?: string
    youtubeUrl: string
    durationSec?: number
    status?: SermonStatus
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
 * manage non-published sermons.
 */
export function listSermons(params: { page?: number; limit?: number; status?: SermonStatus | 'ALL' } = {}) {
    return request<PaginatedSermons>(`/sermons${toQuery(params)}`)
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
