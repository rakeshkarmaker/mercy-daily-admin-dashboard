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

/** A comment on a community post (author, replies nested one level). */
export type CommunityComment = {
    id: string
    author: { id: string; name: string; avatarUrl: string | null } | null
    content: string
    likesCount: number
    isLiked: boolean
    parentId: string | null
    replies: CommunityComment[]
    createdAt: string
    timeAgo: string
}

export type CommunityCommentsPage = {
    data: CommunityComment[]
    page: number
    limit: number
    total: number
}

/** Top-level comments (newest first) with replies nested; any authed user. */
export async function listComments(postId: string, params: { page?: number; limit?: number } = {}): Promise<CommunityCommentsPage> {
    return request(`/posts/${postId}/comments${toQuery(params)}`)
}

/** Soft delete — admins may delete any comment (service enforces role). */
export async function deleteComment(id: string): Promise<void> {
    await request(`/comments/${id}`, { method: 'DELETE' })
}
