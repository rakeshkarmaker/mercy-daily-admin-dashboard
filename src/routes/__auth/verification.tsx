import { useAppForm } from '@/components/shared/forms/form-context'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const searchSchema = z.object({
    user: z.email(),
    type: z.enum(['signup', 'reset']),
})

export const Route = createFileRoute('/__auth/verification')({
    validateSearch: searchSchema,
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const { user, type } = Route.useSearch()
    const [resendDisabled, setResendDisabled] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setResendDisabled(false)
        }
    }, [countdown])

    const verifyOtpSchema = z.object({
        otp: z.string().min(6, 'Enter your 6 digit code'),
    })

    const verifySignup = useMutation({
        mutationFn: async (_payload: any) => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        },
        onSuccess: () => {
            toast.success('Email verified! Welcome aboard.')
            navigate({ to: '/' })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const verifyReset = useMutation({
        mutationFn: async (_payload: any) => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        },
        onSuccess: () => {
            toast.success('Code verified. Choose a new password.')
            navigate({ to: '/reset-password', search: { token: 'mock-token-123' } })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const resend = useMutation({
        mutationFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 500))
        },
        onSuccess: () => {
            toast.success('A new code has been sent to your email.')
            setResendDisabled(true)
            setCountdown(60)
        },
        onError: () => toast.error('Failed to resend code. Please try again.'),
    })

    const form = useAppForm({
        defaultValues: { otp: '' },
        validators: { onChange: verifyOtpSchema },
        onSubmit: async ({ value }) => {
            const payload = { email: user, panel: 'owner' as const, otp: value.otp }
            if (type === 'signup') {
                await verifySignup.mutateAsync(payload)
            } else {
                await verifyReset.mutateAsync(payload)
            }
        },
    })

    return (
        <div className="w-full flex flex-col gap-6">
            <h1 className="text-2xl font-medium text-foreground mb-1">Verification</h1>
            <p className="text-sm text-muted-foreground mb-4">
                We've sent a verification code to <span className="font-semibold text-foreground">{user}</span>.
                <br />
                Please enter it below.
            </p>

            <form
                className="flex flex-col gap-5"
                autoComplete="off"
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                <div className="flex justify-center my-4">
                    <form.AppField name="otp">{(field) => <field.FormInputOtp />}</form.AppField>
                </div>

                <form.AppForm>
                    <form.FormSubmit
                        label="Verify"
                        className="w-full h-12 mt-2 text-base font-medium rounded-full bg-auth-button hover:bg-auth-button/90 text-auth-button-foreground shadow-md border-none"
                    />
                </form.AppForm>
            </form>

            {/* Footer actions */}
            <div className="flex flex-col items-center gap-2 mt-4">
                {countdown > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                        Code expires in {countdown} sec
                    </p>
                )}
                <p className="text-center text-sm text-muted-foreground">
                    Wrong email?{' '}
                    <Link to="/signin" className="text-foreground font-semibold hover:underline">
                        Edit
                    </Link>
                </p>
                {countdown === 0 && (
                    <button
                        type="button"
                        onClick={() => resend.mutate()}
                        disabled={resendDisabled || resend.isPending}
                        className="font-semibold text-foreground text-sm hover:underline disabled:opacity-50 mt-2"
                    >
                        {resend.isPending ? 'Sending...' : 'Resend code'}
                    </button>
                )}
            </div>
        </div>
    )
}
