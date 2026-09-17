import { request, toQuery } from '@/api/base'
import type { ApiUser, User } from '@/types/users'

export type { ApiUser, User } from '@/types/users'

/** Backend → dashboard presentation shape. */
export function toUiUser(u: ApiUser): User {
    return {
        id: u.id,
        name: u.name,
        image: u.avatarUrl ?? '',
        email: u.email,
        phone: '',
        role: u.role === 'ADMIN' ? 'Moderator' : 'User',
        verification: u.isEmailVerified ? 'Verified' : 'Unverified',
        status: u.status === 'ACTIVE' ? 'Active' : u.status === 'BANNED' ? 'Banned' : 'Delete',
    }
}

/** Dashboard role → backend enum. */
function toApiRole(role: 'User' | 'Moderator'): 'ADMIN' | 'APP_USER' {
    return role === 'Moderator' ? 'ADMIN' : 'APP_USER'
}

export async function listUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
}): Promise<{ data: ApiUser[]; total: number; page: number; limit: number }> {
    return request(`/users${toQuery(params)}`)
}

export async function adminCreateUser(dto: {
    name: string
    email: string
    role?: 'ADMIN' | 'APP_USER'
}): Promise<ApiUser & { temporaryPassword: string }> {
    return request('/users', {
        method: 'POST',
        body: JSON.stringify(dto),
    })
}

export async function adminUpdateUser(
    id: string,
    dto: { name?: string; email?: string; role?: 'ADMIN' | 'APP_USER' }
): Promise<ApiUser> {
    return request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
    })
}

/** Active ⇄ deactivated toggle (the UI's status switch). */
export async function adminToggleUserStatus(id: string, activate: boolean): Promise<void> {
    await request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: activate ? 'ACTIVE' : 'DEACTIVATED' }),
    })
}

export async function adminSetUserStatus(
    id: string,
    status: 'ACTIVE' | 'BANNED' | 'DEACTIVATED',
): Promise<void> {
    await request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    })
}

export async function adminDeleteUser(id: string): Promise<void> {
    await request(`/users/${id}`, { method: 'DELETE' })
}

export async function adminHardDeleteUser(id: string): Promise<void> {
    await request(`/users/${id}/permanent`, { method: 'DELETE' })
}

export { toApiRole }
