export type UserRoleUi = 'User' | 'Moderator'
export type UserStatusUi = 'Active' | 'Delete' | 'Banned'
export type UserVerificationUi = 'Verified' | 'Unverified'

/** Dashboard presentation shape for an admin-managed user. */
export type User = {
    id: string
    name: string
    image: string
    email: string
    phone: string
    role: UserRoleUi
    verification: UserVerificationUi
    status: UserStatusUi
}

/** Raw shape returned by GET /users (admin list). */
export type ApiUser = {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'APP_USER'
    status: 'ACTIVE' | 'DEACTIVATED' | 'BANNED' | 'DELETED'
    avatarUrl: string | null
    bio: string | null
    isEmailVerified: boolean
    churchId: string | null
    createdAt: string
    updatedAt: string
}
