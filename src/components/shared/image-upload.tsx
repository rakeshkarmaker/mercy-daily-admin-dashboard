import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/spinner'
import { deleteImage, resolveImage, uploadImage } from '@/api'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

export interface ImageUploadProps {
    /** Current image value: a `/uploads/...` path or an absolute URL. */
    value: string
    onChange: (url: string) => void
    /** Backend upload folder scope (e.g. `sermons`, `worship-music`). */
    folder: string
    disabled?: boolean
    /** Empty-state caption. Defaults to `Upload image (PNG, JPG, WEBP)`. */
    label?: string
    /** Preview img alt text. */
    alt?: string
    /** Shorter (h-28) variant for tight dialogs. Defaults to h-40. */
    compact?: boolean
}

/**
 * Controlled single-image upload for plain React state (dialogs, presenters).
 * Uploads through the backend upload module (`POST /upload/image?folder=…`)
 * and stores the returned `/uploads/...` url. Mirrors the form-bound
 * FormImage, but without the TanStack form field context.
 */
export function ImageUpload({
    value,
    onChange,
    folder,
    disabled,
    label = 'Upload image (PNG, JPG, WEBP)',
    alt = 'Uploaded image',
    compact = false,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)

    const isUploadedFile = value.startsWith('/uploads/')
    const preview = value ? (isUploadedFile ? resolveImage(value) : value) : null

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        setBusy(true)
        try {
            onChange(await uploadImage(file, folder))
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setBusy(false)
        }
    }

    const handleRemove = async () => {
        setBusy(true)
        try {
            // Only server-stored uploads can be deleted on the backend;
            // legacy absolute https URLs are not ours to remove.
            if (isUploadedFile) await deleteImage(value)
            onChange('')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="grid gap-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                disabled={disabled || busy}
                aria-label={label}
            />
            {!preview ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || busy}
                    className={`flex ${compact ? 'h-28' : 'h-40'} w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary bg-primary/10 text-center disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                        {busy ? <Spinner /> : <Upload className="size-5 text-primary" />}
                    </div>
                    <p className="text-sm font-medium">{label}</p>
                </button>
            ) : (
                <div className={`relative ${compact ? 'h-28' : 'h-40'} overflow-hidden rounded-md border-2 border-dashed border-primary`}>
                    <img src={preview} alt={alt} className="mx-auto h-full w-auto object-cover" />
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleRemove}
                        className="absolute right-2 top-2"
                        disabled={disabled || busy}
                    >
                        {busy ? <Spinner /> : <X />}
                    </Button>
                </div>
            )}
        </div>
    )
}
