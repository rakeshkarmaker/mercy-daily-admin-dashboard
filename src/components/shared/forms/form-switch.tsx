import { Field, FieldError } from '@/components/shared/field'
import { Switch } from '@/components/ui/switch'
import { useFieldContext } from './form-context'
import type { ReactNode } from 'react'

type FormSwitchProps = {
    label: ReactNode
    description?: ReactNode
    disabled?: boolean
}

export function FormSwitch({ label, description, disabled }: FormSwitchProps) {
    const field = useFieldContext<boolean>()
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    return (
        <Field data-invalid={isInvalid} className="w-full">
            <div className="flex items-center justify-between w-full">
                <div>
                    {typeof label === 'string' ? (
                        <p className="text-sm font-medium text-foreground">{label}</p>
                    ) : (
                        label
                    )}
                    {description && (
                        typeof description === 'string' ? (
                            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        ) : (
                            description
                        )
                    )}
                </div>
                <Switch 
                    id={field.name}
                    checked={field.state.value ?? false} 
                    onCheckedChange={(checked) => field.handleChange(checked)} 
                    disabled={disabled} 
                />
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
