import { request } from './base'

export type AppSetting = {
    id: string
    logoUrl: string | null
    supportEmail: string | null
    supportPhone: string | null
    websiteUrl: string | null
    companyName: string | null
    address: string | null
    iosAppUrl: string | null
    androidAppUrl: string | null
    instagramUrl: string | null
    twitterUrl: string | null
    youtubeUrl: string | null
    updatedAt: string
}

export type UpdateAppSetting = {
    logoUrl?: string | null
    supportEmail?: string | null
    supportPhone?: string | null
    websiteUrl?: string | null
    companyName?: string | null
    address?: string | null
    iosAppUrl?: string | null
    androidAppUrl?: string | null
    instagramUrl?: string | null
    twitterUrl?: string | null
    youtubeUrl?: string | null
}

export type StaticContent = {
    slug: string
    title: string
    content: string
    updatedBy: string | null
    updatedAt: string | null
}

/** Singleton app settings (General tab) — GET creates the row on first access. */
export const appSettingsApi = {
    get: () => request<AppSetting>('/settings/app'),
    update: (data: UpdateAppSetting) =>
        request<AppSetting>('/settings/app', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
}

/** Editable static pages (privacy policy, terms, about us, contact info). */
export const staticContentApi = {
    get: (slug: string) => request<StaticContent>(`/settings/static/${slug}`),
    update: (slug: string, data: { title: string; content: string }) =>
        request<StaticContent>(`/settings/static/${slug}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
}
