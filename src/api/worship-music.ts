import { request, toQuery } from '@/api/base'
import type { ContentLanguage, TranslationsSync } from '@/lib/language'
import type { WorshipPlaylist, WorshipSong } from '@/types/worship-music'

export type { WorshipPlaylist, WorshipSong }

/** Single shared language contract (en|esp|por) — see @/lib/language. */
export type WorshipLanguage = ContentLanguage

export type WorshipStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'

/** Per-language song block. Empty title on update = remove that translation. */
export type SongTranslationInput = {
    language: WorshipLanguage
    title?: string
    description?: string | null
    bibleReference?: string | null
}

export type SongTranslationsSync = TranslationsSync<SongTranslationInput>

export type SongInput = {
    title: string
    artist?: string
    /** Duration in whole seconds (UI enters decimal minutes, converts here). */
    durationSeconds?: number
    audioUrl?: string | null
    coverUrl?: string | null
    description?: string | null
    bibleReference?: string | null
    playlistId?: string | null
    status?: WorshipStatus
    isFeatured?: boolean
    translations?: SongTranslationInput[] | SongTranslationsSync
}

/** Per-language playlist block. Empty title on update = remove. */
export type PlaylistTranslationInput = {
    language: WorshipLanguage
    title?: string
    description?: string | null
}

export type PlaylistTranslationsSync = TranslationsSync<PlaylistTranslationInput>

export type PlaylistInput = {
    title: string
    description?: string | null
    coverUrl?: string | null
    isFeatured?: boolean
    translations?: PlaylistTranslationInput[] | PlaylistTranslationsSync
}

export type PaginatedSongs = {
    data: WorshipSong[]
    page: number
    limit: number
    total: number
}

export function listSongs(
    params: {
        page?: number
        limit?: number
        status?: WorshipStatus | 'ALL'
        playlistId?: string
        search?: string
        language?: WorshipLanguage
    } = {},
) {
    return request<PaginatedSongs>(`/worship/songs${toQuery(params)}`)
}

export function getSong(id: string, language?: WorshipLanguage) {
    return request<WorshipSong>(
        `/worship/songs/${id}${toQuery(language ? { language } : {})}`,
    )
}

function withTranslations<T extends { translations?: unknown }>(input: T) {
    const { translations } = input
    if (translations === undefined) return input
    // Normalize a bare array into the `{ items }` sync shape the API expects.
    if (Array.isArray(translations)) return { ...input, translations: { items: translations } }
    return input
}

export function createSong(input: SongInput) {
    return request<WorshipSong>('/worship/songs', {
        method: 'POST',
        body: JSON.stringify(withTranslations(input)),
    })
}

export function updateSong(id: string, input: Partial<SongInput>) {
    return request<WorshipSong>(`/worship/songs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(withTranslations(input)),
    })
}

export function deleteSong(id: string) {
    return request<void>(`/worship/songs/${id}`, { method: 'DELETE' })
}

export type WorshipStats = {
    totalSongs: number
    totalPlaylists: number
    featuredCount: number
    totalPlays: number
}

export function getWorshipStats() {
    return request<WorshipStats>('/worship/songs/stats')
}

export function recordSongPlay(id: string, language?: WorshipLanguage) {
    return request<{ id: string; playsCount: number; language: WorshipLanguage }>(
        `/worship/songs/${id}/play${toQuery(language ? { language } : {})}`,
        { method: 'POST' },
    )
}

export function listPlaylists(language?: WorshipLanguage) {
    return request<WorshipPlaylist[]>(
        `/worship/playlists${toQuery(language ? { language } : {})}`,
    )
}

export function getPlaylist(id: string, language?: WorshipLanguage) {
    return request<WorshipPlaylist>(
        `/worship/playlists/${id}${toQuery(language ? { language } : {})}`,
    )
}

export function createPlaylist(input: PlaylistInput) {
    return request<WorshipPlaylist>('/worship/playlists', {
        method: 'POST',
        body: JSON.stringify(withTranslations(input)),
    })
}

export function updatePlaylist(id: string, input: Partial<PlaylistInput>) {
    return request<WorshipPlaylist>(`/worship/playlists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(withTranslations(input)),
    })
}

export function deletePlaylist(id: string) {
    return request<void>(`/worship/playlists/${id}`, { method: 'DELETE' })
}

