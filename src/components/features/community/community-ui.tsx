import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { FilterBuilder } from '@/components/shared/filter-builder'
import type { FilterState, FilterOption } from '@/components/shared/filter-builder'
import { Calendar, Eye, Trash2, Heart, MessageCircle, Share2, Image as ImageIcon, Users } from 'lucide-react'
import type { CommunityPost } from '@/api/community'
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
}: CommunityUIProps) {
    const [viewing, setViewing] = useState<CommunityPost | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

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
                            onClick={() => setViewing(row)}
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
                    <PageHeader title="Community" className="shrink-0 text-xl font-bold text-chart-1" />
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
                <DialogContent className="sm:max-w-lg">
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
                        </>
                    )}
                </DialogContent>
            </Dialog>

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
