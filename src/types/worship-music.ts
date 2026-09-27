export type WorshipSong = {
    id: string
    title: string
    artist: string
    category: string
    duration: string
    audioUrl?: string
    coverUrl?: string
    bibleVerse?: string
    bibleReference?: string
    playlistId?: string
    playlistTitle?: string
    status: 'Published' | 'Scheduled' | 'Draft'
    scheduledDate?: string
    isFeatured: boolean
    playsCount: number
    language?: string
    description?: string
    createdAt: string
    updatedAt: string
}

export type WorshipPlaylist = {
    id: string
    title: string
    description: string
    coverUrl: string
    songCount: number
    isFeatured: boolean
    category: string
    createdAt: string
}

export type WorshipArtist = {
    id: string
    name: string
    imageUrl: string
    tracksCount: number
    bio?: string
}

export type WorshipHeroBanner = {
    id: string
    title: string
    subtitle: string
    coverUrl: string
    buttonText: string
    linkedPlaylistId?: string
    isActive: boolean
}
