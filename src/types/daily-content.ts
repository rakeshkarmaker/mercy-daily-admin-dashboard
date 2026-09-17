export type DailyContent = {
    id: string | number
    title: string
    category: string
    bibleVerse: string
    scheduledDate: string
    status: 'Published' | 'Scheduled'
}
