// The backend serves routes at the root (no /api/v1 prefix) on port 5000.
// VITE_APP_SERVER may point at a deployed API; default to local dev.
export const baseURL = (import.meta.env.VITE_APP_SERVER as string | undefined) ?? 'http://localhost:5000'
export const apiPrefix = ''

export type Paginated<T> = {
    data: T[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

const AUTH_KEYS = ['auth_token', 'auth_refresh_token', 'auth_user'] as const

function clearAuthAndRedirect() {
    for (const key of AUTH_KEYS) localStorage.removeItem(key)
    // Redirect from module scope: the router guard will bounce /__main routes
    // to /signin anyway once the token is gone; push directly when possible.
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
        window.location.assign('/signin')
    }
}

// ── Single-flight token refresh ─────────────────────────────────────────────
// Concurrent 401s share one in-flight POST /auth/refresh so we never rotate
// the refresh token twice in parallel (the second call would fail — the
// first rotation already bumped nothing here, but parallel logins can race
// server-side session checks).
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('auth_refresh_token')
    if (!refreshToken) return null

    try {
        const response = await fetch(`${baseURL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })
        if (!response.ok) return null

        const data = (await response.json()) as {
            accessToken: string
            refreshToken: string
        }
        localStorage.setItem('auth_token', data.accessToken)
        // Rotate the refresh token too (backend re-issues a fresh 7d token).
        localStorage.setItem('auth_refresh_token', data.refreshToken)
        return data.accessToken
    } catch {
        return null
    }
}

/**
 * Refresh, deduplicated across concurrent callers. Returns the new access
 * token or null when the session is unrecoverable.
 */
async function refreshOnce(): Promise<string | null> {
    if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
            refreshInFlight = null
        })
    }
    return refreshInFlight
}

async function parseError(response: Response): Promise<Error> {
    const errorBody = await response.json().catch(() => ({}))
    const message = Array.isArray(errorBody.message)
        ? errorBody.message.join(', ')
        : errorBody.message
    return new Error(message || `Request failed: ${response.status}`)
}

type RequestInitWithAuth = RequestInit & { _isRetry?: boolean }

export async function request<T>(path: string, init?: RequestInitWithAuth): Promise<T> {
    const url = `${baseURL}${apiPrefix}${path}`

    // Let the browser set the multipart boundary for FormData bodies;
    // default to JSON otherwise.
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...((init?.headers as Record<string, string>) || {}),
    }

    const token = localStorage.getItem('auth_token')
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
        ...init,
        headers,
    })

    // Access token expired (or revoked) → try one silent refresh, then
    // replay the original request with the new token. Public endpoints that
    // 401 for other reasons, and already-retried requests, fall through.
    if (response.status === 401 && !init?._isRetry && localStorage.getItem('auth_refresh_token')) {
        const newToken = await refreshOnce()
        if (newToken) {
            return request<T>(path, { ...init, _isRetry: true })
        }
        // Refresh token is dead too — the session cannot recover.
        clearAuthAndRedirect()
    }

    if (!response.ok) {
        throw await parseError(response)
    }

    // 204 No Content (DELETE endpoints) — don't try to parse an empty body.
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

export function toQuery(params: Record<string, string | number | boolean | undefined>) {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '') continue
        usp.set(k, String(v))
    }
    const s = usp.toString()
    return s ? `?${s}` : ''
}


export function resolveImage(image: string | null | undefined): string {
    if (!image) return '/placeholder.jpg'
    if (image.startsWith('http://') || image.startsWith('https://')) return image
    if (image.startsWith('/uploads/')) return `${baseURL}${image}`
    return image
}