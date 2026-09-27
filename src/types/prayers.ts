export type PrayerAuthor = {
    id: string
    name: string
    avatarUrl: string | null
}

export type AdminPrayerUser = {
    id: string
    name: string
    email: string | null
    role?: string
    userProfile?: {
        avatarUrl?: string | null
    } | null
}

export type PrayerItem = {
    id: string
    userId: string | null
    title: string | null
    content: string
    authorName: string | null
    isAnonymous: boolean
    prayCount: number
    isAnswered: boolean
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
    user?: AdminPrayerUser | null
    author?: PrayerAuthor | null
}

export type PaginatedAdminPrayers = {
    items: PrayerItem[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export type AdminQueryPrayersParams = {
    page?: number
    limit?: number
    search?: string
    userId?: string
    isAnswered?: boolean
    includeDeleted?: boolean
}

export type AdminCreatePrayerInput = {
    title?: string
    content: string
    authorName?: string
    userId?: string
    isAnonymous?: boolean
    prayCount?: number
    isAnswered?: boolean
}

export type AdminUpdatePrayerInput = {
    title?: string
    content?: string
    authorName?: string
    userId?: string
    isAnonymous?: boolean
    prayCount?: number
    isAnswered?: boolean
    isDeleted?: boolean
}
