import { request, toQuery } from '@/api/base'
import type { AdminGroupDetail, AdminGroupsResponse, GroupMessagesResponse, GroupStatus } from '@/types/groups'

export type {
    AdminGroupDetail,
    AdminGroupSummary,
    AdminGroupsResponse,
    GroupMember,
    GroupMemberRole,
    GroupMessage,
    GroupMessagesResponse,
    GroupStatus,
    GroupUserRef,
    GroupVisibility,
} from '@/types/groups'

/** Public join page path for an invite code (free to share in the app). */
export function inviteUrl(code: string): string {
    return `https://mercydaily.com/join/${code}`
}

export async function listGroups(params: {
    page?: number
    limit?: number
    search?: string
    status?: GroupStatus
}): Promise<AdminGroupsResponse> {
    return request(`/admin/groups${toQuery(params)}`)
}

export async function getGroup(id: string): Promise<AdminGroupDetail> {
    return request(`/admin/groups/${id}`)
}

/** Newest first; includes soft-deleted messages so moderators see history. */
export async function listGroupMessages(
    id: string,
    params: { page?: number; limit?: number; search?: string } = {},
): Promise<GroupMessagesResponse> {
    return request(`/admin/groups/${id}/messages${toQuery(params)}`)
}

export async function setGroupStatus(id: string, status: 'ACTIVE' | 'SUSPENDED', reason?: string): Promise<AdminGroupDetail> {
    return request(`/admin/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
    })
}

/** Soft delete — rows and message history are retained for moderation. */
export async function deleteGroup(id: string): Promise<void> {
    await request(`/admin/groups/${id}`, { method: 'DELETE' })
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
    await request(`/admin/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
}

/** Moderation delete by message id (works from the messages tab). */
export async function deleteGroupMessage(messageId: string): Promise<void> {
    await request(`/admin/groups/messages/${messageId}`, { method: 'DELETE' })
}
