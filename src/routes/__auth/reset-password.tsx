import { useAppForm } from '@/components/shared/forms/form-context'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

const searchSchema = z.object({
    token: z.string().min(1),
})

export const Route = createFileRoute('/__auth/reset-password')({
    validateSearch: searchSchema,
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { token } = Route.useSearch()

    const resetSchema = z
        .object({
            password: z
                .string()
                .min(8, 'Password must be at least 8 characters')
                .max(32, 'Password must be at most 32 characters'),
            confirmPassword: z.string().min(1, 'Please confirm your password'),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword'],
        })

    const reset = useMutation({
        mutationFn: async (_payload: any) => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        },
        onSuccess: () => {
            toast.success('Password reset successfully!')
            navigate({ to: '/signin' })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: { password: '', confirmPassword: '' },
        validators: { onChange: resetSchema },
        onSubmit: async ({ value }) => {
            await reset.mutateAsync({
                token,
                password: value.password,
            })
        },
    })

    return (
        <div className="w-full flex flex-col gap-6">
            <h1 className="text-2xl font-medium text-foreground mb-1">Reset Password</h1>
            <p className="text-sm text-muted-foreground mb-4">
                Create a new password for your account.
            </p>

            <form
                className="flex flex-col gap-5"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                <form.AppField name="password">
                    {(field) => (
                        <field.FormInput
                            type="password"
                            label="New Password"
                            iconRight={
                                <button type="button" className="focus:outline-none text-muted-foreground hover:text-foreground">
                                    <EyeOff className="w-4 h-4" />
                                </button>
                            }
                            placeholder="Enter your new password"
                        />
                    )}
                </form.AppField>

                <form.AppField name="confirmPassword">
                    {(field) => (
                        <field.FormInput
                            type="password"
                            label="Confirm Password"
                            iconRight={
                                <button type="button" className="focus:outline-none text-muted-foreground hover:text-foreground">
                                    <EyeOff className="w-4 h-4" />
                                </button>
                            }
                            placeholder="Confirm your new password"
                        />
                    )}
                </form.AppField>

                <form.AppForm>
                    <form.FormSubmit
                        label="Reset Password"
                        className="w-full h-12 mt-2 text-base font-medium rounded-full bg-auth-button hover:bg-auth-button/90 text-auth-button-foreground shadow-md border-none"
                    />
                </form.AppForm>
            </form>

            <Button asChild variant="outline" className="w-full h-12 rounded-full border-muted-foreground/30 hover:bg-black/5 mt-2">
                <Link to="/signin">Back to Sign In</Link>
            </Button>
        </div>
    )
}
