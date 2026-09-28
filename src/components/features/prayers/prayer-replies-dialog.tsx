import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Heart,
    Send,
    Plus,
    MessageCircle,
    Quote,
    Trash2,
} from 'lucide-react'
import {
    getPrayerComments,
    addPrayerComment,
    togglePrayerCommentLike,
    type PrayerComment,
} from '@/api/prayers'
import { resolveImage } from '@/api/base'
import { toast } from 'sonner'

export interface PrayerRepliesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    prayerId: string | null
    prayerTitle?: string | null
    prayerAuthor?: string | null
    prayerContent?: string | null
    onCommentAdded?: () => void
}

export function PrayerRepliesDialog({
    open,
    onOpenChange,
    prayerId,
    prayerTitle,
    prayerAuthor = 'Community Member',
    prayerContent,
    onCommentAdded,
}: PrayerRepliesDialogProps) {
    const [comments, setComments] = useState<PrayerComment[]>([])
    const [responseText, setResponseText] = useState('')
    const [sending, setSending] = useState(false)
    const listEndRef = useRef<HTMLDivElement>(null)

    // Load comments whenever dialog opens or prayerId changes
    useEffect(() => {
        if (prayerId && open) {
            const list = getPrayerComments(prayerId)
            setComments(list)
        }
    }, [prayerId, open])

    const handleSend = () => {
        if (!responseText.trim() || !prayerId) return
        setSending(true)
        try {
            const newComment = addPrayerComment(prayerId, responseText)
            setComments((prev) => [...prev, newComment])
            setResponseText('')
            toast.success('Response shared with the community')
            if (onCommentAdded) onCommentAdded()

            // Scroll to end of list
            setTimeout(() => {
                listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        } catch {
            toast.error('Failed to post reply')
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleToggleCommentLike = (commentId: string) => {
        if (!prayerId) return
        const updated = togglePrayerCommentLike(prayerId, commentId)
        setComments(updated)
    }

    const handleDeleteComment = (commentId: string) => {
        if (!prayerId) return
        try {
            const raw = localStorage.getItem('mercy_prayer_comments_v1')
            if (raw) {
                const store = JSON.parse(raw)
                store[prayerId] = (store[prayerId] || []).filter((c: PrayerComment) => c.id !== commentId)
                localStorage.setItem('mercy_prayer_comments_v1', JSON.stringify(store))
                setComments(store[prayerId])
                toast.success('Comment deleted')
                if (onCommentAdded) onCommentAdded()
            }
        } catch {
            toast.error('Could not delete comment')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-xl">
                {/* Header (Matching Screenshot 2: "Replies") */}
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <MessageCircle className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">Replies</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Praying alongside <span className="font-semibold text-foreground">{prayerAuthor}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium text-muted-foreground mr-6">
                            {comments.length} {comments.length === 1 ? 'Response' : 'Responses'}
                        </span>
                    </div>
                </DialogHeader>

                {/* Original Prayer Quote Context */}
                {prayerContent && (
                    <div className="px-6 py-3.5 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-border shrink-0">
                        <div className="flex items-start gap-2.5">
                            <Quote className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                {prayerTitle && (
                                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300 line-clamp-1 mb-0.5">
                                        {prayerTitle}
                                    </p>
                                )}
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                                    {prayerContent}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Comments List (Scrollable Area) */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[260px] max-h-[420px]">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <MessageCircle className="size-6 text-muted-foreground/60" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No replies yet</p>
                            <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                Be the first to leave a response and stand in prayer for this request.
                            </p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-colors shadow-2xs"
                            >
                                {/* Author Avatar */}
                                <div className="size-9 rounded-full overflow-hidden bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center justify-center font-semibold text-xs">
                                    {comment.authorAvatar ? (
                                        <img
                                            src={resolveImage(comment.authorAvatar)}
                                            alt={comment.authorName}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        comment.authorName.slice(0, 2).toUpperCase()
                                    )}
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-sm">
                                                {comment.authorName}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {formatTimeAgo(comment.createdAt)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition-opacity"
                                            title="Delete comment (Admin)"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>

                                    {/* Text content */}
                                    <p className="text-xs sm:text-sm text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                                        {comment.content}
                                    </p>

                                    {/* Footer / Like button */}
                                    <div className="flex items-center gap-3 mt-2.5 pt-1.5 border-t border-border/30">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleCommentLike(comment.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                                comment.isLiked
                                                    ? 'text-red-500 font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Heart
                                                className={`size-3.5 ${
                                                    comment.isLiked ? 'fill-red-500 text-red-500' : ''
                                                }`}
                                            />
                                            <span>{comment.likesCount}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={listEndRef} />
                </div>

                {/* Bottom Bar: "Leave a response" (Matching Screenshot 1 & 2) */}
                <div className="p-4 border-t border-border bg-card shrink-0">
                    <div className="flex items-center gap-2 bg-muted/40 rounded-full px-3 py-1.5 border border-border focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                        <button
                            type="button"
                            onClick={() => {
                                const input = document.getElementById('reply-input') as HTMLInputElement
                                input?.focus()
                            }}
                            className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                            title="Add response"
                        >
                            <Plus className="size-4" />
                        </button>

                        <Input
                            id="reply-input"
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Leave a response..."
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm placeholder:text-muted-foreground"
                        />

                        <Button
                            size="sm"
                            disabled={!responseText.trim() || sending}
                            onClick={handleSend}
                            className="rounded-full h-8 px-3.5 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 cursor-pointer"
                        >
                            <Send className="size-3.5" />
                            <span>Reply</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function formatTimeAgo(dateString: string): string {
    try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        if (diffHours < 1) {
            const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)))
            return `${diffMins}m`
        }
        if (diffHours < 24) {
            return `${diffHours}h`
        }
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays}d`
    } catch {
        return '4h'
    }
}
