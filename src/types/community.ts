export type CommunityPost = {
    id: string
    author: { id: string; name: string; avatarUrl: string | null } | null
    content: string
    imageUrls: string[]
    likesCount: number
    commentsCount: number
    sharesCount: number
    createdAt: string
}

export type FeedResponse = {
    data: CommunityPost[]
    page: number
    limit: number
    total: number
}
