import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { SermonsUI } from '@/components/features/sermons/sermons-ui'
import { createSermon, deleteSermon, listSermons, updateSermon } from '@/api/sermons'
import type { SermonInput, SermonStatus } from '@/api/sermons'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    status: z.enum(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED']).catch('ALL').optional(),
})

export const Route = createFileRoute('/__main/sermons')({
    validateSearch: searchSchema,
    component: SermonsPage,
})

function SermonsPage() {
    const { page = 1, limit = 10, search: searchQuery = '', status = 'ALL' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['sermons', page, limit, status],
        queryFn: () => listSermons({ page, limit, status }),
    })

    const sermons = useMemo(() => {
        const rows = data?.data ?? []
        const query = searchQuery.trim().toLowerCase()
        if (!query) return rows
        return rows.filter((sermon) =>
            [sermon.title, sermon.overview ?? '', sermon.topics.map((t) => t.name).join(' ')].some((value) =>
                value.toLowerCase().includes(query),
            ),
        )
    }, [data?.data, searchQuery])

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['sermons'] })
    }

    const createMutation = useMutation({
        mutationFn: (input: SermonInput) => createSermon(input),
        onSuccess: () => {
            toast.success('Sermon created')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<SermonInput> }) => updateSermon(id, input),
        onSuccess: () => {
            toast.success('Sermon updated')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSermon(id),
        onSuccess: () => {
            toast.success('Sermon deleted')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    return (
        <SermonsUI
            sermons={sermons}
            totalSermons={data?.total ?? 0}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            status={status as SermonStatus | 'ALL'}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onStatusChange={(value) => mergeSearch({ status: value === 'ALL' ? undefined : value, page: 1 })}
            onCreateSermon={(input) => createMutation.mutateAsync(input).then(() => undefined)}
            onUpdateSermon={(id, input) => updateMutation.mutateAsync({ id, input }).then(() => undefined)}
            onDeleteSermon={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
        />
    )
}
