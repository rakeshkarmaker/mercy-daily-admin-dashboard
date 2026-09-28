import { useState } from 'react'
import {
    Heart,
    MessageCircle,
    Plus,
    ChevronLeft,
    Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    getPrayerComments,
    addPrayerComment,
    togglePrayerCommentLike,
    getPrayerEngagement,
    togglePrayerLike,
    type PrayerItem,
    type PrayerComment,
} from '@/api/prayers'
import { resolveImage } from '@/api/base'

interface PrayerMobilePreviewProps {
    prayers: PrayerItem[]
    onPray: (id: string) => Promise<void>
    onShareRequest: () => void
}

export function PrayerMobilePreview({
    prayers,
    onPray,
    onShareRequest,
}: PrayerMobilePreviewProps) {
    const [currentScreen, setCurrentScreen] = useState<'prayers' | 'replies' | 'community'>('prayers')
    const [selectedPrayerForReplies, setSelectedPrayerForReplies] = useState<{
        id: string
        author: string
        content: string
    } | null>(null)

    // Engagement state triggers re-render
    const [, setRefreshKey] = useState(0)
    const [replyInput, setReplyInput] = useState('')

    const bannerEngagement = getPrayerEngagement('banner-prompt', 3)
    const arielleEngagement = getPrayerEngagement('seed-arielle', 6)
    const lucyEngagement = getPrayerEngagement('seed-lucy', 4)

    const handleOpenReplies = (id: string, author: string, content: string) => {
        setSelectedPrayerForReplies({ id, author, content })
        setCurrentScreen('replies')
    }

    const handleTogglePrayerLike = (id: string, defLikes: number) => {
        togglePrayerLike(id, defLikes)
        setRefreshKey((k) => k + 1)
    }

    const handleAddReply = () => {
        if (!replyInput.trim() || !selectedPrayerForReplies) return
        addPrayerComment(selectedPrayerForReplies.id, replyInput)
        setReplyInput('')
        setRefreshKey((k) => k + 1)
    }

    const activeComments: PrayerComment[] = selectedPrayerForReplies
        ? getPrayerComments(selectedPrayerForReplies.id)
        : []

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/20 rounded-2xl border border-border/60">
            {/* Control Bar */}
            <div className="flex items-center gap-2 mb-6 bg-card border border-border rounded-full p-1 shadow-xs">
                <button
                    type="button"
                    onClick={() => setCurrentScreen('prayers')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        currentScreen === 'prayers'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Screen 1: Prayers Feed
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSelectedPrayerForReplies({
                            id: 'seed-arielle',
                            author: 'Arielle',
                            content:
                                'Please pray over my walk and my discipline to stick to the things that matter. Pray that I will not fall to distraction and face my fears and doubts about myself.',
                        })
                        setCurrentScreen('replies')
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        currentScreen === 'replies'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Screen 2: Replies (Comments)
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentScreen('community')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        currentScreen === 'community'
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Screen 3: Community Wall
                </button>
            </div>

            {/* Mobile Device Frame */}
            <div className="relative w-[360px] sm:w-[390px] h-[780px] bg-[#fdfbf7] dark:bg-neutral-950 rounded-[48px] border-[10px] border-neutral-800 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Dynamic Island / Status Bar */}
                <div className="h-11 bg-neutral-900 text-white flex items-center justify-between px-7 shrink-0 select-none">
                    <span className="text-xs font-semibold tracking-tight">10:05</span>
                    <div className="w-24 h-4.5 bg-black rounded-full" />
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span>5G</span>
                        <div className="w-5 h-2.5 border border-white/60 rounded-xs p-0.5 flex items-center">
                            <div className="w-full h-full bg-white rounded-2xs" />
                        </div>
                    </div>
                </div>

                {/* Sub-header Listen / Read pill from screenshot */}
                <div className="bg-neutral-900/90 text-white py-2 px-6 flex items-center justify-center shrink-0">
                    <div className="flex items-center bg-neutral-800/90 rounded-full p-1 border border-neutral-700/60 text-xs">
                        <span className="px-4 py-1 rounded-full font-semibold bg-neutral-700/80 text-white shadow-xs">
                            ✦ LISTEN
                        </span>
                        <span className="px-4 py-1 rounded-full font-semibold text-neutral-400">READ</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#faf8f4] dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
                    {/* ───────────────── SCREEN 1: PRAYERS FEED ───────────────── */}
                    {currentScreen === 'prayers' && (
                        <div className="p-4 space-y-4 pb-20">
                            {/* Grab handle */}
                            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto" />

                            <h2 className="text-center font-bold text-base text-neutral-800 dark:text-neutral-100">
                                Prayers
                            </h2>

                            {/* PRAYER REQUESTS Banner Card */}
                            <div className="rounded-2xl bg-[#fbf8ed] dark:bg-neutral-850 p-4 border border-amber-200/50 dark:border-neutral-800 space-y-2.5 shadow-2xs">
                                <span className="text-[10px] font-bold tracking-wider text-amber-800 dark:text-amber-400 uppercase">
                                    PRAYER REQUESTS
                                </span>
                                <p className="font-semibold text-sm leading-snug">
                                    How can the Glorify community be praying alongside you? 🙏
                                </p>
                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                    <MessageCircle className="size-3" />
                                    <span>559.15k</span>
                                </div>
                                <div className="flex items-center gap-3 pt-1 border-t border-amber-200/30">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePrayerLike('banner-prompt', 3)}
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        <Heart
                                            className={`size-3.5 ${
                                                bannerEngagement.isLiked ? 'fill-red-500 text-red-500' : ''
                                            }`}
                                        />
                                        <span>{bannerEngagement.likesCount}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenReplies(
                                                'banner-prompt',
                                                'Community',
                                                'How can the Glorify community be praying alongside you? 🙏',
                                            )
                                        }
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        <MessageCircle className="size-3.5 text-amber-700" />
                                        <span>{bannerEngagement.commentsCount}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Arielle's Request (Screenshot 1) */}
                            <div className="rounded-2xl bg-white dark:bg-neutral-850 p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-2xs space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center">
                                        A
                                    </div>
                                    <span className="font-bold text-xs">Arielle</span>
                                    <span className="text-[10px] text-neutral-400">4h</span>
                                </div>
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    Please pray over my walk and my discipline to stick to the things that matter.
                                    Pray that I will not fall to distraction and face my fears and doubts about myself.
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePrayerLike('seed-arielle', 6)}
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                    >
                                        <Heart
                                            className={`size-3.5 ${
                                                arielleEngagement.isLiked ? 'fill-red-500 text-red-500' : ''
                                            }`}
                                        />
                                        <span>{arielleEngagement.likesCount}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenReplies(
                                                'seed-arielle',
                                                'Arielle',
                                                'Please pray over my walk and my discipline to stick to the things that matter. Pray that I will not fall to distraction and face my fears and doubts about myself.',
                                            )
                                        }
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 ring-1 ring-red-400/80 rounded-full px-2 py-0.5 bg-red-50/50 dark:bg-red-950/30 cursor-pointer"
                                        title="Comments (Circled in red in screenshot)"
                                    >
                                        <MessageCircle className="size-3.5 text-red-500" />
                                        <span className="font-bold text-red-600 dark:text-red-400">
                                            {arielleEngagement.commentsCount}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Lucy B's Request (Screenshot 1) */}
                            <div className="rounded-2xl bg-white dark:bg-neutral-850 p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-2xs space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-full bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center">
                                        LB
                                    </div>
                                    <span className="font-bold text-xs">Lucy B</span>
                                    <span className="text-[10px] text-neutral-400">5h</span>
                                </div>
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                    Dear God please hear my plea. I pray that my fiance finds answers in you Lord,
                                    Please help guide him to the right path and help him to...
                                </p>
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePrayerLike('seed-lucy', 4)}
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        <Heart
                                            className={`size-3.5 ${
                                                lucyEngagement.isLiked ? 'fill-red-500 text-red-500' : ''
                                            }`}
                                        />
                                        <span>{lucyEngagement.likesCount}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenReplies(
                                                'seed-lucy',
                                                'Lucy B',
                                                'Dear God please hear my plea. I pray that my fiance finds answers in you Lord, Please help guide him to the right path and help him to...',
                                            )
                                        }
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300"
                                    >
                                        <MessageCircle className="size-3.5 text-neutral-600" />
                                        <span>{lucyEngagement.commentsCount}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Live Prayers from DB */}
                            {prayers.slice(0, 3).map((p) => {
                                const eng = getPrayerEngagement(p.id, 2)
                                const name = p.isAnonymous ? 'Anonymous' : p.authorName || p.user?.name || 'Member'
                                return (
                                    <div
                                        key={p.id}
                                        className="rounded-2xl bg-white dark:bg-neutral-850 p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-2xs space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                                    {name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-xs">{name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onPray(p.id)}
                                                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#53624D] text-white flex items-center gap-1"
                                            >
                                                🙏 {p.prayCount}
                                            </button>
                                        </div>
                                        <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                                            {p.content}
                                        </p>
                                        <div className="flex items-center gap-3 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePrayerLike(p.id, 2)}
                                                className="flex items-center gap-1 text-xs text-neutral-600"
                                            >
                                                <Heart
                                                    className={`size-3.5 ${
                                                        eng.isLiked ? 'fill-red-500 text-red-500' : ''
                                                    }`}
                                                />
                                                <span>{eng.likesCount}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenReplies(p.id, name, p.content)}
                                                className="flex items-center gap-1 text-xs text-neutral-600"
                                            >
                                                <MessageCircle className="size-3.5" />
                                                <span>{eng.commentsCount}</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* ───────────────── SCREEN 2: REPLIES (COMMENTS) ───────────────── */}
                    {currentScreen === 'replies' && (
                        <div className="flex-1 flex flex-col p-4 pb-20 space-y-3">
                            {/* Top row with Back and Title (Screenshot 2) */}
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentScreen('prayers')}
                                    className="p-1 rounded-full text-neutral-600 hover:bg-neutral-200/50 cursor-pointer"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <h2 className="font-bold text-base text-neutral-800 dark:text-neutral-100">
                                    Replies
                                </h2>
                                <div className="size-6" />
                            </div>

                            {/* Replies List */}
                            <div className="space-y-3">
                                {activeComments.map((c) => (
                                    <div
                                        key={c.id}
                                        className="rounded-2xl bg-white dark:bg-neutral-850 p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-2xs space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full overflow-hidden bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                                                {c.authorAvatar ? (
                                                    <img
                                                        src={resolveImage(c.authorAvatar)}
                                                        alt={c.authorName}
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    c.authorName.slice(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <span className="font-bold text-xs">{c.authorName}</span>
                                            <span className="text-[10px] text-neutral-400">4h</span>
                                        </div>
                                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                            {c.content}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (selectedPrayerForReplies) {
                                                        togglePrayerCommentLike(selectedPrayerForReplies.id, c.id)
                                                        setRefreshKey((k) => k + 1)
                                                    }
                                                }}
                                                className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer"
                                            >
                                                <Heart
                                                    className={`size-3.5 ${
                                                        c.isLiked ? 'fill-red-500 text-red-500' : ''
                                                    }`}
                                                />
                                                <span>{c.likesCount}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ───────────────── SCREEN 3: PRAYER COMMUNITY ───────────────── */}
                    {currentScreen === 'community' && (
                        <div className="p-4 space-y-4 pb-24 text-center">
                            <div className="space-y-1 pt-2">
                                <h2 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                                    Prayer Community
                                </h2>
                                <p className="text-xs text-neutral-500">Pray together, support one another</p>
                                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 pt-1">
                                    You are not alone. We are praying together.
                                </p>
                            </div>

                            {/* Share a prayer Request Button */}
                            <Button
                                onClick={onShareRequest}
                                className="w-full rounded-full h-11 bg-[#53624D] hover:bg-[#43503e] text-white font-semibold text-sm shadow-sm cursor-pointer"
                            >
                                Share a prayer Request
                            </Button>

                            {/* List of short community prayers (Screenshot 3) */}
                            <div className="space-y-2.5 text-left">
                                {[
                                    { text: 'please pray for my sister in law she is sick', prayed: 0 },
                                    { text: 'hey, my mother is sick , pray for her.', prayed: 0 },
                                    { text: 'hey, pray for me.', prayed: 0 },
                                    { text: 'hello', prayed: 0 },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl bg-white dark:bg-neutral-850 p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-2.5"
                                    >
                                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                            {item.text}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                                <div className="size-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">
                                                    👤
                                                </div>
                                                <span>+{item.prayed} people prayed</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const target = prayers[0]?.id
                                                    if (target) onPray(target)
                                                }}
                                                className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-300/60 dark:border-neutral-700 cursor-pointer"
                                            >
                                                <span>🙏</span>
                                                <span>Pray</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Bar: "Leave a response" input (Screenshot 1 & 2) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onShareRequest}
                        className="size-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 cursor-pointer"
                        title="Add prayer / response"
                    >
                        <Plus className="size-4" />
                    </button>
                    <Input
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply()}
                        placeholder="Leave a response"
                        className="border-0 bg-transparent text-xs placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 h-8"
                    />
                    <button
                        type="button"
                        onClick={handleAddReply}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 cursor-pointer"
                    >
                        <Send className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
