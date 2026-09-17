import { useFieldContext } from '@/components/shared/forms/form-context'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/spinner'
import { deleteImage, resolveImage, uploadImage } from '@/api'
import { Camera, X } from 'lucide-react'
import { useRef, useTransition } from 'react'
import { toast } from 'sonner'

type FormAvatarProps = {
    folder?: string
    disabled?: boolean
    accept?: string
}

export function FormAvatar({ folder = 'avatars', disabled, accept = 'image/png,image/jpeg,image/jpg,image/webp' }: FormAvatarProps) {
    const field = useFieldContext<string | null>()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, startUpload] = useTransition()
    const [isDeleting, startDelete] = useTransition()

    const value = field.state.value
    const busy = isUploading || isDeleting

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
        if (!value) return

        startDelete(async () => {
            try {
                await deleteImage(value)
                field.handleChange('')
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Delete failed')
            }
        })
    }

    return (
        <div className="relative w-max">
            <input
                ref={inputRef}
                id={field.name}
                name={field.name}
                type="file"
                accept={accept}
                onBlur={field.handleBlur}
                onChange={handleFileChange}
                className="sr-only"
                disabled={disabled || busy}
            />

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || busy}
                className="group relative size-16 overflow-hidden rounded-full border border-border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Change avatar"
            >
                <img src={resolveImage(value)} alt="Avatar" crossOrigin="anonymous" className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {isUploading ? <Spinner className="text-white" /> : <Camera className="size-5" />}
                </span>
            </button>

            {value && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={handleDelete}
                    className="absolute bottom-0 right-0 rounded-full border-2 border-background shadow-sm"
                    disabled={disabled || busy}
                >
                    {isDeleting ? <Spinner /> : <X />}
                </Button>
            )}
        </div>
    )
}
