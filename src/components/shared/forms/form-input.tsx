import { Field, FieldError, FieldLabel } from '@/components/shared/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/shared/input-group'
import { useFieldContext } from './form-context'

type FormInputProps = {
    type?: React.HTMLInputTypeAttribute
    label?: string
    placeholder?: string
    readOnly?: boolean
    disabled?: boolean
    icon?: React.ReactNode
    iconRight?: React.ReactNode
    autoComplete?: string
    className?: string
    onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export function FormInput({ type = 'text', label, autoComplete = 'off', ...props }: FormInputProps) {
    const field = useFieldContext<string>()
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    return (
        <Field data-invalid={isInvalid}>
            {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
            {props.icon || props.iconRight ? (
                <InputGroup>
                    {props.icon && <InputGroupAddon>{props.icon}</InputGroupAddon>}
                    <InputGroupInput
                        id={field.name}
                        type={type}
                        name={field.name}
                        autoComplete={autoComplete}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        {...props}
                    />
                    {props.iconRight && <InputGroupAddon align="inline-end">{props.iconRight}</InputGroupAddon>}
                </InputGroup>
            ) : (
                <Input
                    id={field.name}
                    type={type}
                    name={field.name}
                    autoComplete={autoComplete}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    {...props}
                />
            )}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
