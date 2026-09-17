import { request } from '@/api/base'

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
