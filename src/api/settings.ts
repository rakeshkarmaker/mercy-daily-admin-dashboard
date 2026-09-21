import { request } from './base'

export type AppSetting = {
    id: string
    logoUrl: string | null
    updatedAt: string
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
    update: (data: { logoUrl?: string | null }) =>
        request<AppSetting>('/settings/app', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
}

/** Editable static pages (privacy policy, terms & conditions). */
export const staticContentApi = {
    get: (slug: string) => request<StaticContent>(`/settings/static/${slug}`),
    update: (slug: string, data: { title: string; content: string }) =>
        request<StaticContent>(`/settings/static/${slug}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
}
