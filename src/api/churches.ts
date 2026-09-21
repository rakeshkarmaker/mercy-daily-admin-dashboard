import { request } from '@/api/base'

export type ChurchStatus = 'VERIFIED' | 'UNVERIFIED'

export type Church = {
    id: string
    name: string
    address: string | null
    status: ChurchStatus
    createdAt: string
    updatedAt: string
}

export type ChurchInput = {
    name: string
    address?: string | null
    status?: ChurchStatus
}

export function listChurches() {
    return request<Church[]>('/churches')
}

export function getChurch(id: string) {
    return request<Church>(`/churches/${id}`)
}

export function createChurch(input: ChurchInput) {
    return request<Church>('/churches', {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function updateChurch(id: string, input: Partial<ChurchInput>) {
    return request<Church>(`/churches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    })
}

export function deleteChurch(id: string) {
    return request<{ message: string }>(`/churches/${id}`, {
        method: 'DELETE',
    })
}

export function toggleChurchStatus(id: string) {
    return request<Church>(`/churches/${id}/toggle-status`, {
        method: 'PATCH',
    })
}
