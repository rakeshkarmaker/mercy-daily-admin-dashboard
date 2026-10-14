import { request } from '@/api/base'

/**
 * Best-effort Cloudinary cleanup for image fields cleared or replaced by a
 * save (form-level safe delete): every url in `previous` that is deletable
 * (Cloudinary-hosted) and no longer present in `current` is destroyed.
 * Failures are swallowed — the referencing field has already been removed
 * by the save itself, so this only trims storage. Fire-and-forget; callers
 * must not await it inside their save flow.
 */
export function cleanupRemovedImages(previous: (string | null | undefined)[], current: (string | null | undefined)[]): void {
    const kept = new Set(current.filter(Boolean).map((url) => url!.trim()))
    for (const url of previous) {
        const trimmed = url?.trim()
        if (trimmed && !kept.has(trimmed) && isDeletableImage(trimmed)) {
            void deleteImage(trimmed).catch(() => undefined)
        }
    }
}

/**
 * True when the url is a Cloudinary-hosted image (the backend upload
 * module returns `https://res.cloudinary.com/...` secure URLs).
 * Only these are deletable through `DELETE /upload/image` — legacy
 * `/uploads/...` disk paths were retired and external https URLs are
 * not ours to remove.
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
    if (!url) return false
    try {
        return new URL(url).hostname === 'res.cloudinary.com'
    } catch {
        return false
    }
}

/** True when the backend can delete the image behind this url. */
export function isDeletableImage(url: string | null | undefined): boolean {
    return isCloudinaryUrl(url)
}

export async function uploadImage(file: File, folder?: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const path = folder ? `/upload/image?folder=${encodeURIComponent(folder)}` : '/upload/image'

    const { data } = await request<{ data: string }>(path, {
        method: 'POST',
        body: formData,
    })
    return data
}

export async function uploadImages(files: File[], folder?: string): Promise<string[]> {
    const formData = new FormData()
    for (const file of files) {
        formData.append('files', file)
    }

    const path = folder ? `/upload/images?folder=${encodeURIComponent(folder)}` : '/upload/images'

    const { data } = await request<{ data: string[] }>(path, {
        method: 'POST',
        body: formData,
    })
    return data
}

export async function deleteImage(url: string): Promise<void> {
    await request('/upload/image', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
    })
}

export async function deleteImages(urls: string[]): Promise<void> {
    await request('/upload/images', {
        method: 'DELETE',
        body: JSON.stringify({ urls }),
    })
}
