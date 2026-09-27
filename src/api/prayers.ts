import { request, toQuery } from '@/api/base'
import type {
    AdminCreatePrayerInput,
    AdminPrayerUser,
    AdminQueryPrayersParams,
    AdminUpdatePrayerInput,
    PaginatedAdminPrayers,
    PrayerAuthor,
    PrayerItem,
} from '@/types/prayers'

export type {
    AdminCreatePrayerInput,
    AdminPrayerUser,
    AdminQueryPrayersParams,
    AdminUpdatePrayerInput,
    PaginatedAdminPrayers,
    PrayerAuthor,
    PrayerItem,
}

export function listAdminPrayers(params: AdminQueryPrayersParams = {}) {
    return request<PaginatedAdminPrayers>(`/prayers/admin${toQuery(params)}`)
}

export function getAdminPrayer(id: string) {
    return request<PrayerItem>(`/prayers/admin/${id}`)
}

export function createAdminPrayer(input: AdminCreatePrayerInput) {
    return request<PrayerItem>('/prayers/admin', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function updateAdminPrayer(id: string, input: AdminUpdatePrayerInput) {
    return request<PrayerItem>(`/prayers/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

export function deleteAdminPrayer(id: string, hard: boolean = false) {
    const query = hard ? '?hard=true' : ''
    return request<void>(`/prayers/admin/${id}${query}`, {
        method: 'DELETE',
    })
}

export function prayForPrayer(id: string) {
    return request<{ id: string; prayCount: number }>(`/prayers/${id}/pray`, {
        method: 'POST',
    })
}

// Synced API namespace object matching CRM pattern
export const prayersApi = {
    list: listAdminPrayers,
    get: getAdminPrayer,
    create: createAdminPrayer,
    update: updateAdminPrayer,
    delete: deleteAdminPrayer,
    pray: prayForPrayer,
}
