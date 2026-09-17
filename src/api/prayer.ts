export type Prayer = {
    id: number
    title: string
    category: string
    bibleVerse: string
    scheduledDate: string
    author: string
    status: 'Published' | 'Scheduled'
}

export const PRAYERS: Prayer[] = [
    {
        id: 1,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 2,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
    {
        id: 3,
        title: 'Prayer for Peace',
        category: 'Encouragement',
        bibleVerse: 'John 14:27',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 4,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
    {
        id: 5,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 6,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 7,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
    {
        id: 8,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 9,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
    {
        id: 10,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 11,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
    {
        id: 12,
        title: 'Morning Prayer',
        category: 'Gratitude',
        bibleVerse: 'Psalm 5:3',
        scheduledDate: '2026-07-07T08:00:00Z',
        author: 'Admin',
        status: 'Published',
    },
    {
        id: 13,
        title: 'Strength in Hard Times',
        category: 'Prayer for Peace',
        bibleVerse: 'Isaiah 41:10',
        scheduledDate: '2026-07-12T00:00:00Z',
        author: 'Admin',
        status: 'Scheduled',
    },
]

export function getPrayerById(id: number): Prayer | undefined {
    return PRAYERS.find((p) => p.id === id)
}
