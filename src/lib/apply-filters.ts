import type { FilterState } from '@/components/shared/filter-builder'

/**
 * Shared client-side filter/search/pagination helpers used by the route
 * containers (ADR-0008). Centralized here so every page applies the same
 * semantics — never duplicate this logic in a route file.
 */

/** Substring match across the given fields (case-insensitive). */
export function applySearch<T>(
    data: T[],
    query: string,
    fields: Array<keyof T>,
): T[] {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    return data.filter((item) =>
        fields.some((field) =>
            String(item[field] ?? '').toLowerCase().includes(q),
        ),
    )
}

/**
 * Apply FilterBuilder output. `resolve` maps a filter's fieldId to the
 * comparable value for an item (defaults to the property of the same name).
 */
export function applyFilters<T>(
    data: T[],
    filters: FilterState[],
    resolve: (item: T, fieldId: string) => unknown = (item, fieldId) =>
        item[fieldId as keyof T],
): T[] {
    if (filters.length === 0) return data

    return data.filter((item) => {
        for (const filter of filters) {
            const { fieldId, condition, value } = filter
            const contentValue = resolve(item, fieldId)
            if (contentValue === undefined || contentValue === null) continue

            const valStr = String(contentValue).toLowerCase()
            const filterValStr = String(value).toLowerCase()

            if (!value && !['is empty', 'is not empty'].includes(condition)) {
                continue
            }

            // Empty checks (apply to all types)
            if (condition === 'is empty') {
                if (valStr.trim() !== '') return false
                continue
            }
            if (condition === 'is not empty') {
                if (valStr.trim() === '') return false
                continue
            }

            // Date-specific
            if (condition === 'is before') {
                if (!value || valStr >= filterValStr) return false
            } else if (condition === 'is after') {
                if (!value || valStr <= filterValStr) return false
            } else if (condition === 'is between') {
                const [from, to] = Array.isArray(value) ? value : [value, '']
                if (from && valStr < from) return false
                if (to && valStr > to) return false
            }
            // Generic
            else if (
                condition === 'is exactly' ||
                condition === 'is' ||
                condition === '='
            ) {
                if (valStr !== filterValStr) return false
            } else if (
                condition === 'is not exactly' ||
                condition === 'is not' ||
                condition === '!='
            ) {
                if (valStr === filterValStr) return false
            } else if (condition === 'contains') {
                if (!valStr.includes(filterValStr)) return false
            } else if (condition === 'does not contain') {
                if (valStr.includes(filterValStr)) return false
            } else if (condition === 'starts with') {
                if (!valStr.startsWith(filterValStr)) return false
            } else if (condition === 'ends with') {
                if (!valStr.endsWith(filterValStr)) return false
            }
        }
        return true
    })
}

/** Slice one page out of an already-filtered list. */
export function paginate<T>(data: T[], page: number, limit: number): T[] {
    const start = (page - 1) * limit
    return data.slice(start, start + limit)
}
