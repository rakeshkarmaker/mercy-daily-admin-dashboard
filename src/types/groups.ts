export type GroupStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'
export type GroupVisibility = 'PUBLIC' | 'INVITE_ONLY'
export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type GroupUserRef = {
    id: string
    name: string
    avatarUrl: string | null
}

export type GroupMember = {
    userId: string
    name: string
    avatarUrl: string | null
    role: GroupMemberRole
    isMe: boolean
    joinedAt: string
}

export type GroupMessage = {
    id: string
    groupId: string
    content: string
    sender: GroupUserRef | null
    isMine: boolean
    deletedAt: string | null
    createdAt: string
}

export type AdminGroupSummary = {
    id: string
    name: string
    avatarUrl: string | null
    status: GroupStatus
    /** PUBLIC groups are discoverable and joinable by anyone; INVITE_ONLY needs a link. */
    visibility: GroupVisibility
    memberCount: number
    messagesCount: number
    suspendedReason: string | null
    lastMessageAt: string | null
    createdAt: string
    createdBy: GroupUserRef | null
}

export type AdminGroupDetail = AdminGroupSummary & {
    description: string | null
    members: GroupMember[]
    inviteCode: string | null
}

export type AdminGroupsResponse = {
    data: AdminGroupSummary[]
    page: number
    limit: number
    total: number
}

export type GroupMessagesResponse = {
    data: GroupMessage[]
    page: number
    limit: number
    total: number
}
