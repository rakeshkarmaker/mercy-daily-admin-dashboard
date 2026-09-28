import { useState } from 'react'
import { MessageCircle, Heart, Sparkles } from 'lucide-react'
import { getPrayerEngagement, togglePrayerLike } from '@/api/prayers'

interface PrayerBannerProps {
    onOpenReplies: (prayerId: string, prayerTitle: string, prayerAuthor: string, prayerContent: string) => void
}

export function PrayerBanner({ onOpenReplies }: PrayerBannerProps) {
    const bannerId = 'banner-prompt'
    const [engagement, setEngagement] = useState(() => getPrayerEngagement(bannerId, 3))

    const handleToggleLike = () => {
        const next = togglePrayerLike(bannerId, 3)
        setEngagement((prev) => ({
            ...prev,
            likesCount: next.likesCount,
            isLiked: next.isLiked,
        }))
    }

    const title = 'PRAYER REQUESTS'
    const prompt = 'How can the Glorify community be praying alongside you? 🙏'

    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-[#fbf8ee] via-[#faf6ea] to-[#f5eedb] dark:from-card dark:via-card/90 dark:to-muted/40 p-6 sm:p-7 shadow-sm transition-all hover:shadow-md">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="relative flex flex-col gap-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-amber-800 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300/40 dark:border-amber-800/40">
                            {title}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                            <Sparkles className="size-3 text-amber-600 dark:text-amber-400" /> Daily Prompt
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-background/60 border border-amber-200/60 dark:border-border text-xs font-semibold text-muted-foreground shadow-xs">
                        <MessageCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                        <span>559.15k community prayers</span>
                    </div>
                </div>

                {/* Prompt Text */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
                    {prompt}
                </h3>

                {/* Action Row */}
                <div className="flex items-center gap-4 pt-2 border-t border-amber-200/50 dark:border-border/40">
                    {/* Like button */}
                    <button
                        type="button"
                        onClick={handleToggleLike}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            engagement.isLiked
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900'
                                : 'bg-white/80 dark:bg-background/60 hover:bg-white text-muted-foreground hover:text-foreground border border-amber-200/60 dark:border-border'
                        }`}
                        title="Like this prayer prompt"
                    >
                        <Heart
                            className={`size-3.5 transition-transform active:scale-125 ${
                                engagement.isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                            }`}
                        />
                        <span>{engagement.likesCount}</span>
                    </button>

                    {/* Comments / Replies button */}
                    <button
                        type="button"
                        onClick={() => onOpenReplies(bannerId, 'Community Prayer Prompt', 'Glorify Community', prompt)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-background/60 hover:bg-white text-muted-foreground hover:text-foreground border border-amber-200/60 dark:border-border transition-all cursor-pointer ring-1 ring-amber-400/40 hover:ring-amber-500/80"
                        title="View replies to this prayer request"
                    >
                        <MessageCircle className="size-3.5 text-amber-700 dark:text-amber-400" />
                        <span>{engagement.commentsCount > 0 ? engagement.commentsCount : 1}</span>
                        <span className="hidden sm:inline text-[11px] font-normal text-muted-foreground ml-1">Replies</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenReplies(bannerId, 'Community Prayer Prompt', 'Glorify Community', prompt)}
                        className="ml-auto text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        Join Discussion →
                    </button>
                </div>
            </div>
        </div>
    )
}
