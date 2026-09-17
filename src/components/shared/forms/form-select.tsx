import { Field, FieldError, FieldLabel } from '@/components/shared/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFieldContext } from './form-context'

type FormSelectProps = {
    label: string
    options: { label: string; value: string }[]
    placeholder?: string
    disabled?: boolean
}

export function FormSelect({ label, options, placeholder, disabled }: FormSelectProps) {
    const field = useFieldContext<string>()
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
