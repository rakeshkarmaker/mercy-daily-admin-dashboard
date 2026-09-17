import { request, toQuery } from '@/api/base'
import type { CommunityPost, FeedResponse } from '@/types/community'

export type { CommunityPost, FeedResponse } from '@/types/community'

export async function listPosts(params: {
    page?: number
    limit?: number
}): Promise<FeedResponse> {
    return request(`/posts/feed${toQuery(params)}`)
}

export async function getPost(id: string): Promise<CommunityPost> {
    return request(`/posts/${id}`)
}

/** Admin soft delete (sets deletedAt; hidden from feeds). */
export async function deletePost(id: string): Promise<void> {
    await request(`/posts/${id}`, { method: 'DELETE' })
}
