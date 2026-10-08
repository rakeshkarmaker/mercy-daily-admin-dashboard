import { request, toQuery } from '@/api/base'

export type ContactMessageStatus = 'NEW' | 'READ' | 'RESOLVED'

export type ContactMessage = {
    id: string
    name: string
    email: string
    subject: string
    message: string
    status: ContactMessageStatus
    createdAt: string
    updatedAt: string
}

export type ContactMessageList = {
    data: ContactMessage[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export async function listContactMessages(params: {
    page?: number
    limit?: number
    status?: ContactMessageStatus
}): Promise<ContactMessageList> {
    return request(`/contact${toQuery(params)}`)
}

export async function getContactStats(): Promise<{ unread: number; total: number }> {
    return request('/contact/stats')
}

/** Inbox triage: NEW → READ → RESOLVED. */
export async function updateContactStatus(id: string, status: ContactMessageStatus): Promise<ContactMessage> {
    return request(`/contact/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    })
}
