export type OverviewVerse = {
    verse: string
    reference: string
}

export type OverviewStats = {
    totalUsers: number
    totalUsersChange: string
    dailyActive: number
    dailyActiveChange: string
    prayerRequests: number
    prayerRequestsChange: string
    communityPosts: number
    communityPostsChange: string
    upcomingEvents: number
    upcomingEventsChange: string
    aiQuestions: number
    aiQuestionsChange: string
}

export type PerformancePoint = {
    name: string
    userGrowth: number
    communityActivity: number
}

export type EngagementDistribution = {
    prayers: number
    community: number
    mediaViews: number
    totalRate: number
    prayersCount: number
    communityCount: number
    mediaViewsCount: number
}

export type ActivityItem = {
    id: string | number
    user: string
    email: string
    activity: string
    module: string
    date: string
    status: string
}

export type DashboardOverview = {
    verseOfTheDay: OverviewVerse
    systemDate: string
    stats: OverviewStats
    performanceData: PerformancePoint[]
    engagementDistribution: EngagementDistribution
    recentActivities: ActivityItem[]
}
