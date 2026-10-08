/**
 * Single shared language contract for every translatable module
 * (sermons, daily prayers/devotions, worship music).
 *
 * Each row's base columns hold its own original language (`language`,
 * EN by default); rows for the other languages live in that table's
 * translations companion. The API speaks lowercase `en|esp|por` and
 * projects via `?language=`.
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

/** Options for the reusable FilterBuilder language filter. */
export const LANGUAGE_FILTER_OPTIONS = CONTENT_LANGUAGES.map((l) => ({
    label: l.label,
    value: l.value,
}))

/**
 * Read the API `?language=` value back out of FilterBuilder state: the
 * value of the `language` select filter, or undefined when unset (the
 * server then lists everything, each row in its own language).
 */
export function languageFromFilters(
    filters: { fieldId: string; condition: string; value: string | string[] }[],
): ContentLanguage | undefined {
    const match = filters.find((f) => f.fieldId === 'language')
    if (!match || Array.isArray(match.value)) return undefined
    const code = match.value.trim().toLowerCase()
    return (LANGUAGE_CODES as readonly string[]).includes(code)
        ? (code as ContentLanguage)
        : undefined
}

/** Translation sync set shared by all modules: upserts + removals. */
export type TranslationsSync<TItem extends { language: ContentLanguage }> = {
    items: TItem[]
    clearLanguages?: ContentLanguage[]
}
