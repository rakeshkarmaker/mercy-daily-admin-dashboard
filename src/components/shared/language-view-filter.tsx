import { Languages } from 'lucide-react'
import { CONTENT_LANGUAGES } from '@/lib/language'
import type { ContentLanguage } from '@/lib/language'
import { cn } from '@/lib/utils'

/**
 * Shared library-level language filter used by Sermons, Worship Music and
 * Prayer Management. Pill container with a "View" label and one option per
 * language (English/Spanish/Portuguese — the single shared language
 * contract in `@/lib/language`). The selected option renders as a raised
 * white pill; the choice drives the server-side `?language=` projection.
 */
export function LanguageViewFilter({
    value,
    onChange,
    className,
}: {
    value: ContentLanguage
    onChange: (language: ContentLanguage) => void
    className?: string
}) {
    return (
        <div
            role="group"
            aria-label="Content language"
            className={cn(
                'flex w-fit items-center gap-1 rounded-full border border-border/60 bg-muted/40 py-1 pl-3 pr-1',
                className,
            )}
        >
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Languages className="size-4" aria-hidden />
                View
            </span>
            {CONTENT_LANGUAGES.map((language) => {
                const selected = value === language.value
                return (
                    <button
                        key={language.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange(language.value)}
                        className={cn(
                            'cursor-pointer rounded-full px-3 py-1.5 text-sm transition-all',
                            selected
                                ? 'bg-background font-semibold text-foreground shadow-sm'
                                : 'font-normal text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {language.label}
                    </button>
                )
            })}
        </div>
    )
}
