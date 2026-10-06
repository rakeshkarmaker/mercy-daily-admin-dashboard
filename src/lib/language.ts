/**
 * Single shared language contract for every translatable module
 * (sermons, daily prayers/devotions, worship music).
 *
 * English is canonical — it lives in each table's base columns, while
 * esp/por rows live in that table's translations companion. The API
 * speaks lowercase `en|esp|por` and projects via `?language=`.
 */
export const LANGUAGE_CODES = ['en', 'esp', 'por'] as const

export type ContentLanguage = (typeof LANGUAGE_CODES)[number]

export const CONTENT_LANGUAGES: {
    value: ContentLanguage
    label: string
    native: string
}[] = [
    { value: 'en', label: 'English', native: 'English' },
    { value: 'esp', label: 'Spanish', native: 'Español' },
    { value: 'por', label: 'Portuguese', native: 'Português' },
]

export function languageLabel(code: ContentLanguage): string {
    return CONTENT_LANGUAGES.find((l) => l.value === code)?.label ?? code
}

/** Translation sync set shared by all modules: upserts + removals. */
export type TranslationsSync<TItem extends { language: ContentLanguage }> = {
    items: TItem[]
    clearLanguages?: ContentLanguage[]
}
