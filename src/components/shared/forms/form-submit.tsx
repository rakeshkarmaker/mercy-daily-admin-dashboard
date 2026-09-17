import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/spinner'
import { useFormContext } from './form-context'

export function FormSubmit({ label, className }: { label: string; className?: string }) {
    const form = useFormContext()

    return (
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit} className={className}>
                    {isSubmitting ? <Spinner /> : label}
                </Button>
            )}
        </form.Subscribe>
    )
}
