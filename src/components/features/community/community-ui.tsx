import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Calendar, Eye, Trash2, Heart, MessageCircle, Share2, Image as ImageIcon, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { CommunityPost, CommunityComment } from '@/api/community'
import { listComments } from '@/api/community'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { TrashConfirm } from '@/components/shared/trash-confirm'
import { resolveImage } from '@/api/base'

export interface CommunityUIProps {
    posts: CommunityPost[]
    totalPosts: number
    loading?: boolean
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    filters: FilterState[]
    onFiltersChange: (filters: FilterState[]) => void
    onResetSearch: () => void
    onDeletePost: (id: string) => void
    onDeleteComment: (id: string) => Promise<void>
}

export function CommunityUI({
    posts,
    totalPosts,
    loading = false,
    page,
    limit,
    searchQuery,
    onSearchChange,
    filters,
    onFiltersChange,
    onResetSearch,
    onDeletePost,
    onDeleteComment,
}: CommunityUIProps) {
    const [viewing, setViewing] = useState<CommunityPost | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [comments, setComments] = useState<CommunityComment[]>([])
    const [commentsTotal, setCommentsTotal] = useState(0)
    const [commentsLoading, setCommentsLoading] = useState(false)
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

    // Comments load with the post view dialog (top-level + nested replies);
    // the admin deletes any comment inline.
    const openView = (post: CommunityPost) => {
        setViewing(post)
        setComments([])
        setCommentsTotal(post.commentsCount)
        setCommentsLoading(true)
        listComments(post.id, { limit: 50 })
            .then((page) => {
                setComments(page.data)
                setCommentsTotal(page.total)
            })
            .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to load comments'))
            .finally(() => setCommentsLoading(false))
    }

    const handleDeleteComment = async (commentId: string) => {
        setDeletingCommentId(commentId)
        try {
            await onDeleteComment(commentId)
            // Post + thread both update: the comment hides and the
            // post's commentsCount drops (the counter is server-managed).
            setComments((previous) => previous.filter((c) => c.id !== commentId))
            setCommentsTotal((previous) => Math.max(0, previous - 1))
            if (viewing) setViewing({ ...viewing, commentsCount: Math.max(0, viewing.commentsCount - 1) })
        } finally {
            setDeletingCommentId(null)
        }
    }

    const filterOptions: FilterOption[] = useMemo(
        () => [
            {
                id: 'hasImages',
                label: 'Has Images',
                icon: ImageIcon,
                type: 'select',
                options: [
                    { label: 'With images', value: 'yes' },
                    { label: 'Text only', value: 'no' },
                ],
            },
            {
                id: 'createdAt',
                label: 'Posted Date',
                icon: Calendar,
                type: 'date',
            },
        ],
        [],
    )

    const columns: DataTableColumn<CommunityPost>[] = useMemo(
        () => [
            {
                key: 'author',
                header: 'AUTHOR',
                render: (row) => (
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full overflow-hidden shrink-0 bg-muted">
                            {row.author?.avatarUrl ? (
                                <img
                                    src={resolveImage(row.author.avatarUrl)}
                                    alt={row.author.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="size-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                    {(row.author?.name ?? '?').slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <span className="text-foreground font-semibold">{row.author?.name ?? 'Unknown'}</span>
                    </div>
                ),
            },
            {
                key: 'content',
                header: 'CONTENT',
                render: (row) => (
                    <div className="flex items-center gap-2 max-w-100">
                        {row.imageUrls.length > 0 && (
                            <ImageIcon className="size-4 shrink-0 text-muted-foreground/70" />
                        )}
                        <span className="text-muted-foreground truncate">{row.content}</span>
                    </div>
                ),
            },
            {
                key: 'likesCount',
                header: 'ENGAGEMENT',
                render: (row) => (
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1.5">
                            <Heart className="size-3.5" /> {row.likesCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MessageCircle className="size-3.5" /> {row.commentsCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Share2 className="size-3.5" /> {row.sharesCount}
                        </span>
                    </div>
                ),
            },
            {
                key: 'createdAt',
                header: 'POSTED AT',
                render: (row) => {
                    const dateStr = new Date(row.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                    return <span className="text-muted-foreground">{dateStr}</span>
                },
            },
            {
                key: 'action',
                header: 'ACTION',
                render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => openView(row)}
                            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            aria-label="View post"
                        >
                            <Eye className="size-4" />
                        </button>
                        <button
                            onClick={() => setDeletingId(row.id)}
                            className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            aria-label="Delete post"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [],
    )

    return (
        <>
            <div className="flex flex-col w-full max-w-full relative">
                {/* Header & Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <PageHeader title="Community" description="Monitor member posts, engagement, and community activity." />
                    <div className="flex items-center flex-wrap gap-3">
                        <SearchInput
                            value={searchQuery}
                            onValueChange={onSearchChange}
                            placeholder="Search posts..."
                            className="w-full sm:w-62.5 bg-card rounded-full h-10 shadow-sm border-border"
                        />
                        <FilterBuilder options={filterOptions} filters={filters} onFiltersChange={onFiltersChange} />
                    </div>
                </div>

                <div className="flex flex-col">
                    <DataTable
                        columns={columns}
                        data={posts}
                        loading={loading}
                        total={totalPosts}
                        page={page}
                        limit={limit}
                        noun="posts"
                        emptyIcon={<Users className="h-6 w-6" />}
                        onReset={onResetSearch}
                    />
                </div>
            </div>

            {/* Post detail */}
            <Dialog
                open={viewing !== null}
                onOpenChange={(open) => {
                    if (!open) setViewing(null)
                }}
            >
                <DialogContent className="flex max-h-[90vh] overscroll-contain flex-col overflow-y-auto sm:max-w-lg">
                    {viewing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Post by {viewing.author?.name ?? 'Unknown'}</DialogTitle>
                                <DialogDescription>
                                    {new Date(viewing.createdAt).toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <p className="text-sm whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                                {viewing.content}
                            </p>

                            {viewing.imageUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {viewing.imageUrls.map((url) => (
                                        <img
                                            key={url}
                                            src={resolveImage(url)}
                                            alt="Post image"
                                            className="rounded-lg object-cover aspect-square w-full"
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-5 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Heart className="size-4" /> {viewing.likesCount} likes
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MessageCircle className="size-4" /> {viewing.commentsCount} comments
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Share2 className="size-4" /> {viewing.sharesCount} shares
                                </span>
                            </div>

                            {/* Comments thread (admin view — deletes allowed) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-foreground">Comments ({commentsTotal})</h4>
                                </div>
                                {commentsLoading ? (
                                    <CommentListSkeleton />
                                ) : comments.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">No comments on this post.</p>
                                ) : (
                                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                        {comments.map((comment) => (
                                            <CommentRow
                                                key={comment.id}
                                                comment={comment}
                                                deleting={deletingCommentId === comment.id}
                                                onDelete={() => handleDeleteComment(comment.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Comment delete confirm */}
            <TrashConfirm
                open={deletingCommentId !== null}
                onOpenChange={(o) => {
                    if (!o) setDeletingCommentId(null)
                }}
                name={`this comment${deletingCommentId !== null ? ' by ' + (comments.find((c) => c.id === deletingCommentId)?.author?.name ?? 'unknown') : ''}`}
                onConfirm={() => {
                    if (deletingCommentId !== null && deletingCommentId) {
                        void handleDeleteComment(deletingCommentId)
                        setDeletingCommentId(null)
                    }
                }}
            />

            {/* Delete confirm */}
            <TrashConfirm
                open={deletingId !== null}
                onOpenChange={(o) => {
                    if (!o) setDeletingId(null)
                }}
                name={
                    deletingId !== null
                        ? `post by ${
                              posts.find((p) => p.id === deletingId)?.author?.name ?? 'unknown'
                          }`
                        : ''
                }
                onConfirm={() => {
                    if (deletingId !== null) {
                        onDeletePost(deletingId)
                        setDeletingId(null)
                    }
                }}
            />
        </>
    )
}

/**
 * Loading placeholder for the comments thread: three pulsing rows shaped
 * like comment cards so the thread height doesn't jump when the data
 * lands. Pure CSS (animate-pulse) — no extra dependency.
 */
function CommentListSkeleton() {
    return (
        <div className="space-y-2.5" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-card/60 p-3">
                    <div className="flex items-center gap-2">
                        <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                            <div className="h-2 w-14 animate-pulse rounded bg-muted/70" />
                        </div>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                        <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                </div>
            ))}
            <span className="sr-only">Loading comments…</span>
        </div>
    )
}

/** One comment (with nested replies) in the admin post-view dialog. */
function CommentRow({
    comment,
    deleting,
    onDelete,
}: {
    comment: CommunityComment
    deleting: boolean
    onDelete: () => void
}) {
    return (
        <div className="rounded-lg border border-border/50 bg-card/60 p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="size-7 rounded-full overflow-hidden shrink-0 bg-muted">
                        {comment.author?.avatarUrl ? (
                            <img src={resolveImage(comment.author.avatarUrl)} alt={comment.author.name} className="size-full object-cover" />
                        ) : (
                            <div className="size-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                                {(comment.author?.name ?? '?').slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate block">{comment.author?.name ?? 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground">{comment.timeAgo}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    aria-label="Delete comment"
                    title="Delete comment"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
            <p className="mt-2 text-xs text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
            {comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 border-l-2 border-border/40 pl-3">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-foreground block truncate">{reply.author?.name ?? 'Unknown'}</span>
                                <p className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words">{reply.content}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onDelete}
                                disabled={deleting}
                                className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                aria-label="Delete reply"
                                title="Delete reply"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
