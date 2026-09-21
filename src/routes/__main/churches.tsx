import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { ChurchesUI } from '@/components/features/churches/churches-ui'
import { createChurch, deleteChurch, listChurches, updateChurch } from '@/api/churches'
import type { ChurchInput } from '@/api/churches'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/churches')({
    validateSearch: searchSchema,
    component: ChurchesPage,
})

function ChurchesPage() {
    const { page = 1, limit = 10, search: searchQuery = '' } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const { data: allChurches = [], isLoading } = useQuery({
        queryKey: ['churches'],
        queryFn: listChurches,
    })

    // Filter and paginate client-side as backend returns the church directory array
    const filteredChurches = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return allChurches
        return allChurches.filter((c) =>
            [c.name, c.address ?? ''].some((val) => val.toLowerCase().includes(query)),
        )
    }, [allChurches, searchQuery])

    const paginatedChurches = useMemo(() => {
        const start = (page - 1) * limit
        return filteredChurches.slice(start, start + limit)
    }, [filteredChurches, page, limit])

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['churches'] })
    }

    const createMutation = useMutation({
        mutationFn: (input: ChurchInput) => createChurch(input),
        onSuccess: () => {
            toast.success('Church registered successfully')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<ChurchInput> }) =>
            updateChurch(id, input),
        onSuccess: () => {
            toast.success('Church updated successfully')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteChurch(id),
        onSuccess: () => {
            toast.success('Church deleted successfully')
            invalidate()
        },
        onError: (error: Error) => toast.error(error.message),
    })

    return (
        <ChurchesUI
            churches={paginatedChurches}
            totalChurches={filteredChurches.length}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, page: 1 })}
            onCreateChurch={(input) => createMutation.mutateAsync(input).then(() => undefined)}
            onUpdateChurch={(id, input) =>
                updateMutation.mutateAsync({ id, input }).then(() => undefined)
            }
            onDeleteChurch={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
        />
    )
}
