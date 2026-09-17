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
