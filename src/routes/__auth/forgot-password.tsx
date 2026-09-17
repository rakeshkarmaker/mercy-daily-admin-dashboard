import { useAppForm } from '@/components/shared/forms/form-context'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/__auth/forgot-password')({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()

    const forgotSchema = z.object({
        email: z.email('Enter your email address'),
    })

    const forgot = useMutation({
        mutationFn: async (_payload: any) => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        },
        onSuccess: () => {
            toast.success('A new code has been sent to your email.')
            navigate({ to: '/verification', search: { user: form.state.values.email, type: 'reset' } })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const form = useAppForm({
        defaultValues: { email: '' },
        validators: { onChange: forgotSchema },
        onSubmit: async ({ value }) => {
            await forgot.mutateAsync({
                email: value.email,
                panel: 'owner',
            })
        },
    })

    return (
        <div className="w-full flex flex-col gap-6">
            <h1 className="text-2xl font-medium text-foreground mb-1">Forgot Password</h1>
            <p className="text-sm text-muted-foreground mb-4">
                Enter your email and we'll send you a password reset link.
            </p>

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

                <form.AppForm>
                    <form.FormSubmit
                        label="Send Reset Link"
                        className="w-full h-12 mt-2 text-base font-medium rounded-full bg-auth-button hover:bg-auth-button/90 text-auth-button-foreground shadow-md border-none"
                    />
                </form.AppForm>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
                Remember your password?{' '}
                <Link to="/signin" className="text-foreground font-semibold hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
