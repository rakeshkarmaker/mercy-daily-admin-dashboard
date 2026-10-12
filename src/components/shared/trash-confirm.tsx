import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ReactNode } from 'react'

type TrashConfirmProps = {
    /** The trigger element — rendered inside AlertDialogTrigger with asChild */
    children?: ReactNode
    /** The name shown in the confirmation message */
    name: ReactNode
    /** Title of the confirmation dialog */
    title?: string
    /** Description shown before the item name */
    description?: string
    /** Called when the user confirms the action */
    onConfirm: () => void
    /** Reversibility note after the item name (default warns it cannot be undone). */
    reversibilityNote?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function TrashConfirm({
    children,
    name,
    title = 'Are you sure?',
    description = 'Are you sure you want to remove',
    onConfirm,
    open,
    onOpenChange,
    reversibilityNote = 'This action cannot be undone.',
}: TrashConfirmProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description} <strong className="text-foreground">{name}</strong>? {reversibilityNote}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Remove</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
