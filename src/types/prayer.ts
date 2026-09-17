export type Prayer = {
    id: number
    title: string
    category: string
    bibleVerse: string
    scheduledDate: string
    author: string
    status: 'Published' | 'Scheduled'
}
