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

export type BoardingLanguage = 'en' | 'esp' | 'por'

/** Per-language onboarding content (rows for languages other than the base). */
export type BoardingMessageTranslation = {
    language: BoardingLanguage
    message: string
    verse: string
}

export type BoardingMessage = {
    id: string
    message: string
    verse: string
    /** Language of the top-level message/verse in this response. */
    language: BoardingLanguage
    /** Stored original language of the base columns — edit forms use this as the base. Optional for rollout tolerance. */
    baseLanguage?: BoardingLanguage
    /** Every other language's content. */
    translations: BoardingMessageTranslation[]
    updatedAt: string
}

export type UpdateBoardingMessage = {
    /** Original language of the top-level fields (en default). */
    language?: BoardingLanguage
    message: string
    verse: string
    /** Full-replace sync set: languages absent from items are removed server-side. */
    translations?: {
        items: BoardingMessageTranslation[]
    }
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

/** Singleton boarding message shown on app start (Onboarding tab). */
export const boardingMessageApi = {
    get: () => request<BoardingMessage>('/settings/boarding-message'),
    update: (data: UpdateBoardingMessage) =>
        request<BoardingMessage>('/settings/boarding-message', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
}
