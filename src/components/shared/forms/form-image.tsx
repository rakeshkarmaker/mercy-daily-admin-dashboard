import { useFieldContext } from '@/components/shared/forms/form-context'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/shared/field'
import { Spinner } from '@/components/shared/spinner'
import { baseURL, deleteImage, uploadImage } from '@/api'
import { Upload, X } from 'lucide-react'
import { useRef, useTransition } from 'react'
import { toast } from 'sonner'

type FormImageProps = {
    label: string
    folder?: string
    disabled?: boolean
    accept?: string
}

export function FormImage({ label, folder, disabled, accept = 'image/png,image/jpeg,image/jpg,image/webp' }: FormImageProps) {
    const field = useFieldContext<string | null>()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, startUpload] = useTransition()
    const [isDeleting, startDelete] = useTransition()

    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        startUpload(async () => {
            try {
                const url = await uploadImage(file, folder)
                field.handleChange(url)
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Upload failed')
            }
        })
    }

    const handleDelete = () => {
        const currentUrl = field.state.value
        if (!currentUrl) return

        startDelete(async () => {
            try {
                await deleteImage(currentUrl)
                field.handleChange('')
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Delete failed')
            }
        })
    }

    const previewUrl = field.state.value ? `${baseURL}${field.state.value}` : null

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

            <input
                ref={inputRef}
                id={field.name}
                name={field.name}
                type="file"
                accept={accept}
                onBlur={field.handleBlur}
                onChange={handleFileChange}
                aria-invalid={isInvalid}
                className="sr-only"
                disabled={disabled || isUploading}
            />

            {!previewUrl ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full h-40 flex-col items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10 p-6 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={disabled || isUploading}
                >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {isUploading ? <Spinner /> : <Upload className="text-primary" />}
                    </div>

                    <p className="text-sm font-medium">Upload PNG,JPG</p>
                </button>
            ) : (
                <div className="relative h-40 rounded-md border-2 border-dashed border-primary">
                    <img
                        src={previewUrl}
                        alt={field.state.value || undefined}
                        crossOrigin="anonymous"
                        className="h-full w-auto mx-auto object-cover"
                    />
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDelete}
                        className="absolute top-2 right-2"
                        disabled={disabled || isDeleting}
                    >
                        {isDeleting ? <Spinner /> : <X />}
                    </Button>
                </div>
            )}

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
    )
}
