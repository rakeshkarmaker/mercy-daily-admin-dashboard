import { request } from '@/api/base'
import { useAppForm } from '@/components/shared/forms/form-context'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

type RegisterResponse = {
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

export const Route = createFileRoute('/__auth/signup')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const signupSchema = z
        .object({
            name: z.string().min(2, 'Name must be at least 2 characters').max(255),
            email: z.email('Enter a valid email address'),
            password: z
                .string()
                .min(8, 'Password must be at least 8 characters')
                .max(32, 'Password must be at most 32 characters')
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
                    message: 'Password must contain uppercase, lowercase, and a number',
                }),
            confirmPassword: z.string().min(1, 'Please confirm your password'),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword'],
        })

    const signUp = useMutation({
        mutationFn: async (payload: {
            name: string
            email: string
            password: string
            confirmPassword: string
        }) => {
            return request<RegisterResponse>('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload),
            })
        },
        onSuccess: async (data, variables) => {
            toast.success('Registration successful! Please verify your email.')
            navigate({
                to: '/verification',
                search: {
                    user: variables.email,
                    type: 'signup',
                },
            })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
        validators: { onChange: signupSchema },
        onSubmit: async ({ value }) => {
            await signUp.mutateAsync(value)
        },
    })

    return (
        <div className="w-full flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-medium text-foreground mb-1">Create an Account</h1>
                <p className="text-sm text-muted-foreground">Sign up to join Mercy Daily.</p>
            </div>

            <form
                className="flex flex-col gap-4"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                <form.AppField name="name">
                    {(field) => (
                        <field.FormInput
                            type="text"
                            label="Full Name"
                            placeholder="Enter Your Full Name"
                        />
                    )}
                </form.AppField>

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
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            iconRight={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="focus:outline-none text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            }
                            placeholder="Create a strong password"
                        />
                    )}
                </form.AppField>

                <form.AppField name="confirmPassword">
                    {(field) => (
                        <field.FormInput
                            type={showConfirmPassword ? 'text' : 'password'}
                            label="Confirm Password"
                            iconRight={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="focus:outline-none text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                            }
                            placeholder="Confirm your password"
                        />
                    )}
                </form.AppField>

                <form.AppForm>
                    <form.FormSubmit
                        label="Create Account"
                        className="w-full h-12 mt-2 text-base font-medium rounded-full bg-auth-button hover:bg-auth-button/90 text-auth-button-foreground shadow-md border-none cursor-pointer"
                    />
                </form.AppForm>

                <div className="text-center text-xs text-muted-foreground pt-1">
                    Already have an account?{' '}
                    <Link to="/signin" className="font-semibold text-foreground hover:underline">
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    )
}
