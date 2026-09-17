export type NotificationCampaign = {
    id: string
    title: string
    audience: string
    date: string
    delivered: string
    opened: string
}

const MOCK_NOTIFICATIONS: NotificationCampaign[] = [
    { id: '1', title: 'Daily Devotional Available', audience: 'All Users', date: '2024-03-15', delivered: '8,456', opened: '5,962' },
    { id: '2', title: 'New Content Available', audience: 'Free Users', date: '2024-03-14', delivered: '8,456', opened: '5,962' },
    { id: '3', title: 'System Maintenance', audience: 'All Users', date: '2024-03-10', delivered: '8,456', opened: '5,962' },
    { id: '4', title: 'New Feature Announcement', audience: 'Premium Users', date: '2024-03-08', delivered: '8,456', opened: '5,962' },
    { id: '5', title: 'Welcome Message', audience: 'New Users', date: '2024-03-08', delivered: '8,456', opened: '5,962' },
    { id: '6', title: 'New Content Available', audience: 'All Users', date: '2024-03-07', delivered: '8,456', opened: '5,962' },
]

export function getNotifications(): NotificationCampaign[] {
    return MOCK_NOTIFICATIONS;
}
