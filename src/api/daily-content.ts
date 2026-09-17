export type DailyContent = {
    id: number
    contentType: 'Bible Verse' | 'Prayer' | 'Quote'
    title: string
    category: 'Daily Verse' | 'Daily Prayer' | 'Inspiration'
    scheduledDate: string
    lastUpdated: string
    status: 'Published' | 'Draft' | 'Scheduled'
}

export let DAILY_CONTENTS: DailyContent[] = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    contentType: 'Bible Verse',
    title: "God's Love Never Fails",
    category: 'Daily Verse',
    scheduledDate: '2026-07-12',
    lastUpdated: '2028-07-12',
    status: 'Published',
}))

export function getContentById(id: number): DailyContent | undefined {
    return DAILY_CONTENTS.find((c) => c.id === id)
}
