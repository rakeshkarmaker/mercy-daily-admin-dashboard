import { request } from '@/api/base'
import type { DashboardOverview } from '@/types/overview'

export type { DashboardOverview }

export function getOverview(): Promise<DashboardOverview> {
    return request<DashboardOverview>('/overview')
}

export const overviewApi = {
    get: getOverview,
}
