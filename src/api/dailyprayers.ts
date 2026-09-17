import { request, toQuery } from '@/api/base'

export type Prayer = {
    id: number
    verse: string
    reference: string
    reflection: string
    prayer: string
    practice: string | null
    createdAt: string
    updatedAt: string
}

export type PrayerInput = {
    verse: string
    reference: string
    reflection: string
    prayer: string
    practice?: string
}

export type PrayerSchedule = {
    id: number
    scheduledFor: string
    prayer: Prayer
}

export type PaginatedPrayers = {
    data: Prayer[]
    page: number
    limit: number
    total: number
}

export function listPrayers(params: { page?: number; limit?: number } = {}) {
    return request<PaginatedPrayers>(`/dailyprayers${toQuery(params)}`)
}

export function listSchedules() {
    return request<PrayerSchedule[]>('/dailyprayers/schedules')
}

export function getPrayer(id: number) {
    return request<Prayer>(`/dailyprayers/${id}`)
}

export function createPrayer(input: PrayerInput) {
    return request<Prayer>('/dailyprayers', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function updatePrayer(id: number, input: Partial<PrayerInput>) {
    return request<Prayer>(`/dailyprayers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

export function deletePrayer(id: number) {
    return request<void>(`/dailyprayers/${id}`, { method: 'DELETE' })
}

export function schedulePrayer(id: number, scheduledFor: string) {
    return request<Prayer>(`/dailyprayers/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledFor }),
    })
}
