import { request, toQuery } from '@/api/base'
import type {
    AdminCreatePrayerInput,
    AdminPrayerUser,
    AdminQueryPrayersParams,
    AdminUpdatePrayerInput,
    PaginatedAdminPrayers,
    PrayerAuthor,
    PrayerItem,
} from '@/types/prayers'

export type {
    AdminCreatePrayerInput,
    AdminPrayerUser,
    AdminQueryPrayersParams,
    AdminUpdatePrayerInput,
    PaginatedAdminPrayers,
    PrayerAuthor,
    PrayerItem,
}

export function listAdminPrayers(params: AdminQueryPrayersParams = {}) {
    return request<PaginatedAdminPrayers>(`/prayers/admin${toQuery(params)}`)
}

export function getAdminPrayer(id: string) {
    return request<PrayerItem>(`/prayers/admin/${id}`)
}

export function createAdminPrayer(input: AdminCreatePrayerInput) {
    return request<PrayerItem>('/prayers/admin', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function updateAdminPrayer(id: string, input: AdminUpdatePrayerInput) {
    return request<PrayerItem>(`/prayers/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

export function deleteAdminPrayer(id: string, hard: boolean = false) {
    const query = hard ? '?hard=true' : ''
    return request<void>(`/prayers/admin/${id}${query}`, {
        method: 'DELETE',
    })
}

export function prayForPrayer(id: string) {
    return request<{ id: string; prayCount: number }>(`/prayers/${id}/pray`, {
        method: 'POST',
    })
}

// ── Client-side Community Comments & Likes (Synced with localStorage) ──────────

import type { PrayerComment } from '@/types/prayers'
export type { PrayerComment }

const COMMENTS_STORAGE_KEY = 'mercy_prayer_comments_v1'
const LIKES_STORAGE_KEY = 'mercy_prayer_likes_v1'

const INITIAL_COMMENTS: Record<string, PrayerComment[]> = {
    'banner-prompt': [
        {
            id: 'c-banner-1',
            prayerId: 'banner-prompt',
            authorName: 'David K.',
            authorAvatar: null,
            content: 'Praying for open hearts, revival in our churches, and unity across our community this week! 🙏✨',
            likesCount: 5,
            isLiked: false,
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
    ],
    'seed-arielle': [
        {
            id: 'c-arielle-1',
            prayerId: 'seed-arielle',
            authorName: 'Tammy Townsend',
            authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face',
            content:
                "Dear Heavenly Father, i pray in the precious name of Jesus Christ that you give Arielle's faith a strength that surpasses her expecting. Give her confidence to be bold about her faith in you Jesus. Guide her steps always on the sacred path of righteousness. In faith I thank you Jesus, for.....",
            likesCount: 1,
            isLiked: false,
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
            id: 'c-arielle-2',
            prayerId: 'seed-arielle',
            authorName: 'Marcus Vance',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
            content:
                'Standing in prayer with you Arielle! Remember 2 Timothy 1:7: For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
            likesCount: 2,
            isLiked: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
    ],
    'seed-lucy': [
        {
            id: 'c-lucy-1',
            prayerId: 'seed-lucy',
            authorName: 'Pastor Michael',
            authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
            content:
                'Father, touch Lucy’s fiancé’s heart. Open his eyes to your boundless grace and draw him near to you with cords of unfailing love.',
            likesCount: 3,
            isLiked: false,
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
    ],
}

function loadCommentsStore(): Record<string, PrayerComment[]> {
    try {
        const raw = localStorage.getItem(COMMENTS_STORAGE_KEY)
        if (!raw) {
            localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(INITIAL_COMMENTS))
            return INITIAL_COMMENTS
        }
        return JSON.parse(raw)
    } catch {
        return INITIAL_COMMENTS
    }
}

function saveCommentsStore(store: Record<string, PrayerComment[]>) {
    try {
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(store))
    } catch {
        // ignore
    }
}

function loadLikesStore(): Record<string, { count: number; isLiked: boolean }> {
    try {
        const raw = localStorage.getItem(LIKES_STORAGE_KEY)
        if (!raw) {
            const defaults: Record<string, { count: number; isLiked: boolean }> = {
                'banner-prompt': { count: 3, isLiked: false },
                'seed-arielle': { count: 6, isLiked: false },
                'seed-lucy': { count: 4, isLiked: false },
            }
            localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(defaults))
            return defaults
        }
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

function saveLikesStore(store: Record<string, { count: number; isLiked: boolean }>) {
    try {
        localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(store))
    } catch {
        // ignore
    }
}

export function getPrayerComments(prayerId: string): PrayerComment[] {
    const store = loadCommentsStore()
    return store[prayerId] || []
}

export function addPrayerComment(prayerId: string, content: string, authorName?: string): PrayerComment {
    const store = loadCommentsStore()
    const userRaw = localStorage.getItem('auth_user')
    let currentUserName = authorName || 'Anonymous Member'
    let currentAvatar: string | null = null

    if (userRaw) {
        try {
            const parsed = JSON.parse(userRaw)
            if (parsed.name) currentUserName = parsed.name
            if (parsed.image) currentAvatar = parsed.image
        } catch {
            // ignore
        }
    }

    const newComment: PrayerComment = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prayerId,
        authorName: currentUserName,
        authorAvatar: currentAvatar,
        content: content.trim(),
        likesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
    }

    store[prayerId] = [...(store[prayerId] || []), newComment]
    saveCommentsStore(store)
    return newComment
}

export function togglePrayerCommentLike(prayerId: string, commentId: string): PrayerComment[] {
    const store = loadCommentsStore()
    const comments = store[prayerId] || []
    const updated = comments.map((c) => {
        if (c.id === commentId) {
            const nextLiked = !c.isLiked
            return {
                ...c,
                isLiked: nextLiked,
                likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
            }
        }
        return c
    })
    store[prayerId] = updated
    saveCommentsStore(store)
    return updated
}

export function getPrayerEngagement(prayerId: string, defaultLikes: number = 0) {
    const likesStore = loadLikesStore()
    const commentsStore = loadCommentsStore()
    const likeData = likesStore[prayerId] || { count: defaultLikes, isLiked: false }
    const comments = commentsStore[prayerId] || []

    return {
        likesCount: likeData.count,
        isLiked: likeData.isLiked,
        commentsCount: comments.length,
    }
}

export function togglePrayerLike(prayerId: string, defaultLikes: number = 0) {
    const likesStore = loadLikesStore()
    const current = likesStore[prayerId] || { count: defaultLikes, isLiked: false }
    const nextLiked = !current.isLiked
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1)

    likesStore[prayerId] = {
        count: nextCount,
        isLiked: nextLiked,
    }
    saveLikesStore(likesStore)

    return {
        likesCount: nextCount,
        isLiked: nextLiked,
    }
}

// Synced API namespace object matching CRM pattern
export const prayersApi = {
    list: listAdminPrayers,
    get: getAdminPrayer,
    create: createAdminPrayer,
    update: updateAdminPrayer,
    delete: deleteAdminPrayer,
    pray: prayForPrayer,
    getComments: getPrayerComments,
    addComment: addPrayerComment,
    toggleCommentLike: togglePrayerCommentLike,
    getEngagement: getPrayerEngagement,
    toggleLike: togglePrayerLike,
}
