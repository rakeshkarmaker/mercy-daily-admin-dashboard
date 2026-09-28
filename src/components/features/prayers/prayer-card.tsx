import { useState } from 'react'
import {
    Heart,
    MessageCircle,
    HandHeart,
    CheckCircle2,
    Sparkles,
    Trash2,
    Pencil,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolveImage } from '@/api/base'
import {
    getPrayerEngagement,
    togglePrayerLike,
    type PrayerItem,
} from '@/api/prayers'

interface PrayerCardProps {
    prayer: PrayerItem
    defaultLikes?: number
    onPray: (id: string) => Promise<void>
    onOpenReplies: (prayerId: string, prayerTitle: string, prayerAuthor: string, prayerContent: string) => void
    onOpenEdit?: (prayer: PrayerItem) => void
    onOpenDelete?: (prayer: PrayerItem) => void
    onToggleAnswered?: (prayer: PrayerItem) => void
}

export function PrayerCard({
    prayer,
    defaultLikes = 0,
    onPray,
    onOpenReplies,
    onOpenEdit,
    onOpenDelete,
    onToggleAnswered,
}: PrayerCardProps) {
    const [praying, setPraying] = useState(false)
    const [engagement, setEngagement] = useState(() => getPrayerEngagement(prayer.id, defaultLikes))

    const authorName = prayer.isAnonymous
        ? 'Anonymous'
        : prayer.authorName || prayer.user?.name || prayer.author?.name || 'Community Member'

    const avatarUrl = !prayer.isAnonymous
        ? prayer.user?.userProfile?.avatarUrl || prayer.author?.avatarUrl
        : null

    const handleToggleLike = () => {
        const next = togglePrayerLike(prayer.id, defaultLikes)
        setEngagement((prev) => ({
            ...prev,
            likesCount: next.likesCount,
            isLiked: next.isLiked,
        }))
    }

    const handlePrayClick = async () => {
        if (praying) return
        setPraying(true)
        try {
            await onPray(prayer.id)
        } finally {
            setPraying(false)
        }
    }

    const timeAgo = formatTimeAgo(prayer.createdAt)

    return (
        <div className="group relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md hover:border-border transition-all">
            {/* Header: Author + Meta + Status */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="size-10 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 shrink-0 flex items-center justify-center font-bold text-sm">
                        {avatarUrl ? (
                            <img src={resolveImage(avatarUrl)} alt={authorName} className="size-full object-cover" />
                        ) : (
                            authorName.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-sm">{authorName}</span>
                            <span className="text-xs text-muted-foreground">• {timeAgo}</span>
                            {prayer.isAnonymous && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                                    Anon
                                </Badge>
                            )}
                        </div>
                        {prayer.user?.email && !prayer.isAnonymous && (
                            <span className="text-[11px] text-muted-foreground truncate max-w-xs">
                                {prayer.user.email}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-1.5">
                    {prayer.isAnswered ? (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1 text-[11px] font-medium">
                            <CheckCircle2 className="size-3" /> Answered
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 gap-1 text-[11px] font-medium">
                            <Sparkles className="size-3" /> Needs Prayer
                        </Badge>
                    )}
                </div>
            </div>

            {/* Prayer Content */}
            <div className="mt-3.5 space-y-1">
                {prayer.title && (
                    <h4 className="font-bold text-foreground text-base tracking-tight">{prayer.title}</h4>
                )}
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                    {prayer.content}
                </p>
            </div>

            {/* Bottom Row: Like, Comments, Pray (+1), and Admin Actions */}
            <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                {/* Likes & Comments Buttons */}
                <div className="flex items-center gap-3">
                    {/* Like button */}
                    <button
                        type="button"
                        onClick={handleToggleLike}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            engagement.isLiked
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                        }`}
                        title="Like prayer"
                    >
                        <Heart
                            className={`size-3.5 transition-transform active:scale-125 ${
                                engagement.isLiked ? 'fill-red-500 text-red-500' : ''
                            }`}
                        />
                        <span>{engagement.likesCount}</span>
                    </button>

                    {/* Comments button (Matches user screenshot circled in red!) */}
                    <button
                        type="button"
                        onClick={() =>
                            onOpenReplies(
                                prayer.id,
                                prayer.title || 'Prayer Request',
                                authorName,
                                prayer.content,
                            )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all cursor-pointer ring-1 ring-primary/20 hover:ring-primary/60"
                        title="View and reply to comments"
                    >
                        <MessageCircle className="size-3.5 text-primary" />
                        <span>{engagement.commentsCount}</span>
                    </button>

                    {/* Avatar stack + people prayed */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
                        <div className="flex -space-x-1.5">
                            <div className="size-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold border border-card">
                                ✝
                            </div>
                            <div className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold border border-card">
                                🙏
                            </div>
                        </div>
                        <span className="font-medium text-foreground">+{prayer.prayCount}</span>
                        <span className="text-muted-foreground text-[11px]">prayed</span>
                    </div>
                </div>

                {/* Right side: Pray Button & Admin buttons */}
                <div className="flex items-center gap-2">
                    {/* The distinctive Pray button from Screenshot 3 */}
                    <Button
                        size="sm"
                        disabled={praying}
                        onClick={handlePrayClick}
                        className="rounded-full h-8 px-3.5 gap-1.5 text-xs font-semibold bg-[#53624D] hover:bg-[#43503e] text-white shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                        <HandHeart className="size-3.5" />
                        <span>Pray</span>
                    </Button>

                    {/* Admin Options */}
                    {onToggleAnswered && (
                        <button
                            type="button"
                            onClick={() => onToggleAnswered(prayer)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title={prayer.isAnswered ? 'Mark unanswered' : 'Mark answered (Testimony)'}
                        >
                            <CheckCircle2 className="size-4" />
                        </button>
                    )}

                    {onOpenEdit && (
                        <button
                            type="button"
                            onClick={() => onOpenEdit(prayer)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Edit prayer"
                        >
                            <Pencil className="size-4" />
                        </button>
                    )}

                    {onOpenDelete && (
                        <button
                            type="button"
                            onClick={() => onOpenDelete(prayer)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Delete prayer"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
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
        return 'recently'
    }
}
