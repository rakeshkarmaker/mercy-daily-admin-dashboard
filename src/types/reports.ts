export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
export type ReportTargetType = 'POST' | 'COMMENT' | 'GROUP_MESSAGE'
export type ReportReason =
    | 'SPAM'
    | 'HARASSMENT'
    | 'INAPPROPRIATE_CONTENT'
    | 'MISINFORMATION'
    | 'OTHER'

export type ApiReport = {
    id: string
    targetType: ReportTargetType
    targetId: string
    reason: ReportReason
    status: ReportStatus
    details: string | null
    createdAt: string
    updatedAt: string
    reporter: { id: string; name: string; avatarUrl: string | null }
    /** Reported content preview; null when the target was hard-removed. */
    target: { content: string; deleted: boolean } | null
}

/** Dashboard presentation shape for the reports queue. */
export type Report = {
    id: string
    targetType: ReportTargetType
    /** Id of the reported post/comment/group message — needed for content actions (remove/keep). */
    targetId: string
    reason: ReportReason
    status: ReportStatus
    details: string | null
    reporterName: string
    /** Snippet of the reported content ('' when unavailable). */
    targetSnippet: string
    /** True when the reported content has since been soft-deleted. */
    targetDeleted: boolean
    createdAt: string
}
