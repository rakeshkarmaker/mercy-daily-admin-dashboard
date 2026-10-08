import type { ContentLanguage } from '@/lib/language'

/** Single shared language contract (en|esp|por) — see @/lib/language. */
export type WorshipLanguage = ContentLanguage

export type WorshipSongStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'

export type WorshipSongPlaylist = {
    id: string
    title: string
}

/** Per-language song content (esp/por rows; en mirrors the base fields). */
export type WorshipSongTranslation = {
    language: WorshipLanguage
    title: string
    description: string | null
    bibleReference: string | null
}

export type WorshipSong = {
    id: string
    title: string
    artist: string
    /** Duration in whole seconds (storage + API contract). */
    durationSeconds: number
    /** Display string derived server-side (m:ss). */
    duration: string
    audioUrl: string | null
    coverUrl: string | null
    description: string | null
    bibleReference: string | null
    status: WorshipSongStatus
    isFeatured: boolean
    playsCount: number
    playlist: WorshipSongPlaylist | null
    /** Language of the top-level title/description/verse in this response. */
    language: WorshipLanguage
    /** Every other language's content (non-en projections lead with en). */
    translations: WorshipSongTranslation[]
    createdAt: string
    updatedAt: string
}

/** Per-language playlist content (esp/por rows; en mirrors base fields). */
export type WorshipPlaylistTranslation = {
    language: WorshipLanguage
    title: string
    description: string | null
}

export type WorshipPlaylist = {
    id: string
    title: string
    description: string | null
    coverUrl: string | null
    isFeatured: boolean
    /** Computed server-side from actual songs. */
    songCount: number
    /** Language of the top-level title/description in this response. */
    language: WorshipLanguage
    /** Every other language's content (non-en projections lead with en). */
    translations: WorshipPlaylistTranslation[]
    createdAt: string
    updatedAt: string
}

