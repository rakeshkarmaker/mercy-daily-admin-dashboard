import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useSearchParams } from '@/hooks/use-search-params'
import { CommunityUI } from '@/components/features/community/community-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listPosts, deletePost } from '@/api/community'
import type { FilterState } from '@/components/shared/filter-builder'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    filters: z.string().catch('[]').optional(),
})

export const Route = createFileRoute('/__main/community')({
    validateSearch: searchSchema,
    component: CommunityPage,
})

function CommunityPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const [filters, setFilters] = useState<FilterState[]>([])
    const queryClient = useQueryClient()

    // Server-paginated feed. For an admin this returns all live posts.
    const { data: feed = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['community', page, limit],
        queryFn: () => listPosts({ page, limit }),
    })

    const posts = feed.data

    const filteredPosts = useMemo(() => {
        let result = posts
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (p) =>
                    (p.author?.name ?? '').toLowerCase().includes(q) ||
                    p.content.toLowerCase().includes(q),
            )
        }
        if (filters.length > 0) {
            result = result.filter((p) => {
                for (const { fieldId, condition, value } of filters) {
                    if (fieldId === 'hasImages') {
                        const has = p.imageUrls.length > 0
                        const matches =
                            (value === 'yes' && has) || (value === 'no' && !has)
                        if (condition === 'is' && !matches) return false
                    } else if (fieldId === 'createdAt') {
                        const valStr = p.createdAt.slice(0, 10)
                        if (condition === 'is before' && !(valStr < value)) return false
                        if (condition === 'is after' && !(valStr > value)) return false
                        if (condition === 'is' && valStr !== value) return false
                    }
                }
                return true
            })
        }
        return result
    }, [posts, searchQuery, filters])

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deletePost(id),
        onSuccess: () => {
            toast.success('Post deleted')
            queryClient.invalidateQueries({ queryKey: ['community'] })
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleSearchChange = (value: string) => {
        mergeSearch({ search: value || undefined, page: 1 })
    }

    const handleResetSearch = () => {
        mergeSearch({ search: undefined, page: 1 })
        setFilters([])
    }

    return (
        <CommunityUI
            posts={filteredPosts}
            totalPosts={feed.total}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={(f) => {
                setFilters(f)
                mergeSearch({ page: 1 })
            }}
            onResetSearch={handleResetSearch}
            onDeletePost={(id) => deleteMutation.mutate(id)}
        />
    )
}
