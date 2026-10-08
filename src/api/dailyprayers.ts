import { request, toQuery } from '@/api/base'
import type { ContentLanguage, TranslationsSync } from '@/lib/language'

/** Single shared language contract (en|esp|por) — see @/lib/language. */
export type PrayerLanguage = ContentLanguage

export type Prayer = {
    id: number
    verse: string
    reference: string
    reflection: string
    prayer: string
    practice: string | null
    viewsCount: number
    language: PrayerLanguage
    translations: PrayerTranslation[]
    createdAt: string
    updatedAt: string
}

export type PrayerInput = {
    /** Original language of the top-level fields (en default). */
    language?: PrayerLanguage
    verse: string
    reference: string
    reflection: string
    prayer: string
    practice?: string
}

/** One language payload of a devotion (daily prayer). */
export type PrayerTranslationInput = PrayerInput & {
    language: ContentLanguage
}

/** Translations sync set: upsert items, delete listed languages. */
export type PrayerTranslationsSync = TranslationsSync<PrayerTranslationInput>

export type PrayerTranslation = PrayerTranslationInput & {
    updatedAt: string
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

export function listPrayers(params: { page?: number; limit?: number; language?: PrayerLanguage } = {}) {
    return request<PaginatedPrayers>(`/dailyprayers${toQuery(params)}`)
}

export function listSchedules() {
    return request<PrayerSchedule[]>('/dailyprayers/schedules')
}

export function getPrayer(id: number, language?: PrayerLanguage) {
    return request<Prayer>(`/dailyprayers/${id}${toQuery(language ? { language } : {})}`)
}

export function getPrayerTranslations(id: number) {
    return request<PrayerTranslation[]>(`/dailyprayers/${id}/translations`)
}

export function createPrayer(input: PrayerInput, translations?: PrayerTranslationsSync) {
    return request<Prayer>('/dailyprayers', {
        method: 'POST',
        body: JSON.stringify(translations ? { ...input, translations } : input),
    })
}

export function updatePrayer(id: number, input: Partial<PrayerInput>, translations?: PrayerTranslationsSync | null) {
    return request<Prayer>(`/dailyprayers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(
            translations === undefined ? input : { ...input, translations: translations ?? {} },
        ),
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

export function updateSchedule(id: number, input: { devotionId?: number; scheduledFor?: string }) {
    return request<PrayerSchedule>(`/dailyprayers/schedules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

export function deleteSchedule(id: number) {
    return request<void>(`/dailyprayers/schedules/${id}`, { method: 'DELETE' })
}

export type TodayPrayer = {
    id?: number
    date: string
    verse: string
    reference: string
    reflection: string
    prayer: string
    practice?: string | null
    viewsCount?: number
    language?: PrayerLanguage
    translations?: PrayerTranslation[]
    createdAt?: string
    updatedAt?: string
}

export function getTodayPrayer(language?: PrayerLanguage) {
    return request<TodayPrayer>(`/dailyprayers/today${toQuery(language ? { language } : {})}`)
}

export type PrayerView = {
    id: number
    viewsCount: number
    language: PrayerLanguage
}

export function recordPrayerView(id: number, language?: PrayerLanguage) {
    return request<PrayerView>(`/dailyprayers/${id}/view${toQuery(language ? { language } : {})}`, {
        method: 'POST',
    })
}
