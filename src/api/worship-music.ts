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

// Seed data based directly on the actual Mercy Daily mobile app Worship Music screen
export const INITIAL_FEATURED_BANNER: WorshipHeroBanner = {
    id: 'hero-1',
    title: 'Praise the Lord All My Soul',
    subtitle: 'A playlist to lift your heart in worship.',
    coverUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=1200&q=80',
    buttonText: 'Play Now',
    linkedPlaylistId: 'pl-1',
    isActive: true,
}

export const INITIAL_PLAYLISTS: WorshipPlaylist[] = [
    {
        id: 'pl-1',
        title: 'Morning Worship',
        description: 'Start your morning in reverent prayer and peace.',
        coverUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
        songCount: 20,
        isFeatured: true,
        category: 'Morning Prayer',
        createdAt: '2026-07-01T08:00:00Z',
    },
    {
        id: 'pl-2',
        title: 'Peace & Hope',
        description: 'Gentle melodies to soothe anxiety and encourage faith.',
        coverUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
        songCount: 18,
        isFeatured: true,
        category: 'Prayer for Peace',
        createdAt: '2026-07-05T08:00:00Z',
    },
    {
        id: 'pl-3',
        title: 'Strength in God',
        description: 'Uplifting anthems of deliverance and holy victory.',
        coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
        songCount: 15,
        isFeatured: true,
        category: 'Encouragement',
        createdAt: '2026-07-10T08:00:00Z',
    },
    {
        id: 'pl-4',
        title: 'Deep Devotion',
        description: 'Intimate acoustic worship for personal reflection time.',
        coverUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80',
        songCount: 12,
        isFeatured: false,
        category: 'Gratitude',
        createdAt: '2026-07-12T08:00:00Z',
    },
]

export const INITIAL_ARTISTS: WorshipArtist[] = [
    {
        id: 'art-1',
        name: 'Brandon Lake',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
        tracksCount: 8,
        bio: 'American Christian worship singer and songwriter.',
    },
    {
        id: 'art-2',
        name: 'Bethel Music',
        imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80',
        tracksCount: 14,
        bio: 'Worship music ministry originating from Redding, California.',
    },
    {
        id: 'art-3',
        name: 'Hillsong Worship',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        tracksCount: 19,
        bio: 'Praise and worship music group based in Sydney, Australia.',
    },
    {
        id: 'art-4',
        name: 'Sinach',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        tracksCount: 6,
        bio: 'Nigerian gospel music singer, songwriter, and senior worship leader.',
    },
    {
        id: 'art-5',
        name: 'Hillsong UNITED',
        imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80',
        tracksCount: 11,
        bio: 'Contemporary worship band originating from Hillsong Church.',
    },
]

export const INITIAL_SONGS: WorshipSong[] = [
    {
        id: 'song-1',
        title: 'Gratitude',
        artist: 'Brandon Lake',
        category: 'Gratitude',
        duration: '4:46',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Psalm 103:1',
        bibleReference: 'Psalm 103:1 - Bless the Lord, O my soul, and all that is within me.',
        playlistId: 'pl-1',
        playlistTitle: 'Morning Worship',
        status: 'Published',
        scheduledDate: '2026-07-07T08:00:00Z',
        isFeatured: true,
        playsCount: 14250,
        language: 'English',
        description: 'A prayer of humble thanks for God’s steadfast love and abundant grace.',
        createdAt: '2026-07-01T08:00:00Z',
        updatedAt: '2026-07-01T08:00:00Z',
    },
    {
        id: 'song-2',
        title: 'Goodness of God',
        artist: 'Bethel Music',
        category: 'Prayer for Peace',
        duration: '4:32',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Psalm 23:6',
        bibleReference: 'Psalm 23:6 - Surely goodness and mercy shall follow me all the days of my life.',
        playlistId: 'pl-1',
        playlistTitle: 'Morning Worship',
        status: 'Published',
        scheduledDate: '2026-07-07T08:00:00Z',
        isFeatured: true,
        playsCount: 22800,
        language: 'English',
        description: 'Testimony anthem declaring the faithful kindness of the Lord through every season.',
        createdAt: '2026-07-02T08:00:00Z',
        updatedAt: '2026-07-02T08:00:00Z',
    },
    {
        id: 'song-3',
        title: 'What a Beautiful Name',
        artist: 'Hillsong Worship',
        category: 'Encouragement',
        duration: '5:41',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Colossians 1:16',
        bibleReference: 'Colossians 1:16 - For by Him all things were created.',
        playlistId: 'pl-2',
        playlistTitle: 'Peace & Hope',
        status: 'Published',
        scheduledDate: '2026-07-12T00:00:00Z',
        isFeatured: true,
        playsCount: 31400,
        language: 'English',
        description: 'Exalting the matchless name and sovereign resurrection of Jesus Christ.',
        createdAt: '2026-07-03T08:00:00Z',
        updatedAt: '2026-07-03T08:00:00Z',
    },
    {
        id: 'song-4',
        title: 'Way Maker',
        artist: 'Sinach',
        category: 'Faith & Trust',
        duration: '6:08',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Isaiah 43:19',
        bibleReference: 'Isaiah 43:19 - I will make a way in the wilderness and rivers in the desert.',
        playlistId: 'pl-3',
        playlistTitle: 'Strength in God',
        status: 'Published',
        scheduledDate: '2026-07-15T00:00:00Z',
        isFeatured: true,
        playsCount: 29500,
        language: 'English',
        description: 'Proclaiming God as miracle worker, promise keeper, and light in the darkness.',
        createdAt: '2026-07-04T08:00:00Z',
        updatedAt: '2026-07-04T08:00:00Z',
    },
    {
        id: 'song-5',
        title: 'Oceans (Where Feet May Fail)',
        artist: 'Hillsong UNITED',
        category: 'Prayer for Peace',
        duration: '8:56',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Matthew 14:29',
        bibleReference: 'Matthew 14:29 - Come, He said. Then Peter got down out of the boat.',
        playlistId: 'pl-2',
        playlistTitle: 'Peace & Hope',
        status: 'Scheduled',
        scheduledDate: '2026-08-01T00:00:00Z',
        isFeatured: true,
        playsCount: 45100,
        language: 'English',
        description: 'A prayer of surrender, stepping beyond comfort into deep oceans of faith.',
        createdAt: '2026-07-05T08:00:00Z',
        updatedAt: '2026-07-05T08:00:00Z',
    },
    {
        id: 'song-6',
        title: 'Morning Prayer',
        artist: 'Mercy Daily Worship',
        category: 'Gratitude',
        duration: '3:50',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=400&q=80',
        bibleVerse: 'Psalm 5:3',
        bibleReference: 'Psalm 5:3 - In the morning, Lord, you hear my voice.',
        playlistId: 'pl-1',
        playlistTitle: 'Morning Worship',
        status: 'Published',
        scheduledDate: '2026-07-07T08:00:00Z',
        isFeatured: false,
        playsCount: 8900,
        language: 'English',
        description: 'Morning prayer meditation melody for daily reflection and quiet time.',
        createdAt: '2026-07-06T08:00:00Z',
        updatedAt: '2026-07-06T08:00:00Z',
    },
]

// Storage helpers with localStorage fallback for persistent client-side admin management
const STORAGE_KEY_SONGS = 'mercy_worship_songs'
const STORAGE_KEY_PLAYLISTS = 'mercy_worship_playlists'
const STORAGE_KEY_BANNER = 'mercy_worship_banner'
const STORAGE_KEY_ARTISTS = 'mercy_worship_artists'

export function getStoredSongs(): WorshipSong[] {
    if (typeof window === 'undefined') return INITIAL_SONGS
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SONGS)
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(INITIAL_SONGS))
            return INITIAL_SONGS
        }
        return JSON.parse(stored)
    } catch {
        return INITIAL_SONGS
    }
}

export function saveStoredSongs(songs: WorshipSong[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs))
    }
}

export function getStoredPlaylists(): WorshipPlaylist[] {
    if (typeof window === 'undefined') return INITIAL_PLAYLISTS
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PLAYLISTS)
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(INITIAL_PLAYLISTS))
            return INITIAL_PLAYLISTS
        }
        return JSON.parse(stored)
    } catch {
        return INITIAL_PLAYLISTS
    }
}

export function saveStoredPlaylists(playlists: WorshipPlaylist[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(playlists))
    }
}

export function getStoredBanner(): WorshipHeroBanner {
    if (typeof window === 'undefined') return INITIAL_FEATURED_BANNER
    try {
        const stored = localStorage.getItem(STORAGE_KEY_BANNER)
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(INITIAL_FEATURED_BANNER))
            return INITIAL_FEATURED_BANNER
        }
        return JSON.parse(stored)
    } catch {
        return INITIAL_FEATURED_BANNER
    }
}

export function saveStoredBanner(banner: WorshipHeroBanner) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(banner))
    }
}

export function getStoredArtists(): WorshipArtist[] {
    if (typeof window === 'undefined') return INITIAL_ARTISTS
    try {
        const stored = localStorage.getItem(STORAGE_KEY_ARTISTS)
        if (!stored) {
            localStorage.setItem(STORAGE_KEY_ARTISTS, JSON.stringify(INITIAL_ARTISTS))
            return INITIAL_ARTISTS
        }
        return JSON.parse(stored)
    } catch {
        return INITIAL_ARTISTS
    }
}

export function saveStoredArtists(artists: WorshipArtist[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ARTISTS, JSON.stringify(artists))
    }
}
