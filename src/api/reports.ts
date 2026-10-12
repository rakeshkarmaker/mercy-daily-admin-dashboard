import { request, toQuery } from '@/api/base'
import type {
    ApiReport,
    Report,
    ReportStatus,
} from '@/types/reports'

export type { ApiReport, Report, ReportReason, ReportStatus, ReportTargetType } from '@/types/reports'

/** Backend row → presentation shape. */
export function toUiReport(r: ApiReport): Report {
    return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        details: r.details,
        reporterName: r.reporter?.name ?? 'Unknown',
        targetSnippet: r.target?.content ?? '',
        targetDeleted: r.target?.deleted ?? true,
        createdAt: r.createdAt,
    }
}

export async function listReports(params: {
    page?: number
    limit?: number
    status?: ReportStatus
    search?: string
}): Promise<{ data: ApiReport[]; total: number; page: number; limit: number }> {
    return request(`/reports${toQuery(params)}`)
}

/** Lifecycle transition: PENDING → REVIEWED → RESOLVED/DISMISSED. */
export async function updateReportStatus(id: string, status: ReportStatus): Promise<unknown> {
    return request(`/reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    })
}

/** Take down the reported content (admin soft-delete, recoverable). */
export async function removeReportedContent(targetType: 'POST' | 'COMMENT', targetId: string): Promise<void> {
    const path = targetType === 'POST' ? `/posts/${targetId}` : `/posts/comments/${targetId}`
    await request(path, { method: 'DELETE' })
}

/**
 * Paired moderation: remove the reported content, then resolve the
 * report. The report resolves even if the content is already gone
 * (already-deleted targets 404 on delete — still a valid resolution).
 */
export async function removeContentAndResolve(
    reportId: string,
    targetType: 'POST' | 'COMMENT',
    targetId: string,
): Promise<void> {
    try {
        await removeReportedContent(targetType, targetId)
    } catch (error) {
        // Content already deleted/gone — resolving is still correct.
        if (!(error instanceof Error) || !/not found/i.test(error.message)) throw error
    }
    await updateReportStatus(reportId, 'RESOLVED')
}
