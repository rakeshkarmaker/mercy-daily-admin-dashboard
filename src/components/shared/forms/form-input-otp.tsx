import { Field, FieldError } from '@/components/shared/field'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { useFieldContext } from './form-context'

type FormInputOtpProps = {
    disabled?: boolean
}

export function FormInputOtp({ disabled }: FormInputOtpProps) {
    const field = useFieldContext<string>()
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    return (
        <Field data-invalid={isInvalid}>
            <InputOTP maxLength={6} value={field.state.value} onChange={(value) => field.handleChange(value)} disabled={disabled}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
