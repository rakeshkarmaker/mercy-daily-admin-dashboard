import { request } from '@/api/base'
import { useAppForm } from '@/components/shared/forms/form-context'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

/** Shape returned by POST /auth/login (AuthResponseDto). */
type LoginResponse = {
    user: {
        id: string
        name: string
        email: string
        role: 'ADMIN' | 'APP_USER'
        avatarUrl: string | null
        isEmailVerified: boolean
    }
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export const Route = createFileRoute('/__auth/signin')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()

    const signinSchema = z.object({
        email: z.email('Enter your email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(32, 'Password must be at most 32 characters'),
    })

    const signIn = useMutation({
        mutationFn: async (payload: { email: string; password: string }) => {
            return request<LoginResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        },
        onSuccess: async (data) => {
            // The admin dashboard is ADMIN-only — APP_USER accounts are
            // app-mobile users and get bounced here with a clear message.
            if (data.user.role !== 'ADMIN') {
                throw new Error('This dashboard requires an admin account')
            }
            localStorage.setItem('auth_token', data.accessToken)
            localStorage.setItem('auth_refresh_token', data.refreshToken)
            localStorage.setItem(
                'auth_user',
                JSON.stringify({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    image: data.user.avatarUrl ?? '',
                })
            )
            navigate({ to: '/' })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: { email: '', password: '' },
        validators: { onChange: signinSchema },
        onSubmit: async ({ value }) => {
            await signIn.mutateAsync({
                email: value.email,
                password: value.password,
            })
        },
    })

    return (
        <div className="w-full flex flex-col gap-6">
            <h1 className="text-2xl font-medium text-foreground mb-4">Welcome Mercy</h1>

            <form
                className="flex flex-col gap-5"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                <form.AppField name="email">
                    {(field) => (
                        <field.FormInput
                            type="email"
                            label="Email Address"
                            placeholder="Enter Your Email"
                        />
                    )}
                </form.AppField>

                <form.AppField name="password">
                    {(field) => (
                        <field.FormInput
                            type="password"
                            label="Password"
                            iconRight={
                                <button type="button" className="focus:outline-none text-muted-foreground hover:text-foreground">
                                    <EyeOff className="w-4 h-4" />
                                </button>
                            }
                            placeholder="Type Your password"
                        />
                    )}
                </form.AppField>

                <div className="flex items-center justify-between py-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" className="rounded-sm border-muted-foreground/30 text-auth-button focus:ring-auth-button bg-transparent" />
                        Remember me
                    </label>
                    <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-foreground hover:underline"
                    >
                        Forget Password
                    </Link>
                </div>

                <form.AppForm>
                    <form.FormSubmit
                        label="Sign in"
                        className="w-full h-12 text-base font-medium rounded-full bg-auth-button hover:bg-auth-button/90 text-auth-button-foreground shadow-md border-none"
                    />
                </form.AppForm>
            </form>
        </div>
    )
}
