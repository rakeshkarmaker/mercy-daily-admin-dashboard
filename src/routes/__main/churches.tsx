import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from '@/hooks/use-search-params'
import { toast } from 'sonner'
import * as z from 'zod'
import { ChurchesUI } from '@/components/features/churches/churches-ui'
import type { ChurchStatusFilter } from '@/components/features/churches/churches-ui'
import {
    createChurch,
    deleteChurch,
    listChurches,
    toggleChurchStatus,
    updateChurch,
} from '@/api/churches'
import type { ChurchInput } from '@/api/churches'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    search: z.string().catch('').optional(),
    status: z.enum(['ALL', 'VERIFIED', 'UNVERIFIED']).catch('ALL').optional(),
})

export const Route = createFileRoute('/__main/churches')({
    validateSearch: searchSchema,
    component: ChurchesPage,
})

function ChurchesPage() {
    const {
        page = 1,
        limit = 10,
        search: searchQuery = '',
        status: statusFilter = 'ALL',
    } = Route.useSearch()
    const mergeSearch = useSearchParams()
    const queryClient = useQueryClient()

    const { data: allChurches = [], isLoading } = useQuery({
        queryKey: ['churches'],
        queryFn: listChurches,
    })

    const verifiedCount = useMemo(
        () => allChurches.filter((c) => c.status === 'VERIFIED').length,
        [allChurches],
    )

    const unverifiedCount = useMemo(
        () => allChurches.filter((c) => c.status === 'UNVERIFIED').length,
        [allChurches],
    )

    // Filter and paginate client-side as backend returns the church directory array
    const filteredChurches = useMemo(() => {
        let result = allChurches

        if (statusFilter !== 'ALL') {
            result = result.filter((c) => c.status === statusFilter)
        }

        const query = searchQuery.trim().toLowerCase()
        if (query) {
            result = result.filter((c) =>
                [c.name, c.address ?? ''].some((val) => val.toLowerCase().includes(query)),
            )
        }

        return result
    }, [allChurches, searchQuery, statusFilter])

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

    const toggleStatusMutation = useMutation({
        mutationFn: (id: string) => toggleChurchStatus(id),
        onSuccess: (updated) => {
            toast.success(`Church marked as ${updated.status.toLowerCase()}`)
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
            verifiedCount={verifiedCount}
            unverifiedCount={unverifiedCount}
            loading={isLoading}
            page={page}
            limit={limit}
            searchQuery={searchQuery}
            statusFilter={statusFilter as ChurchStatusFilter}
            onStatusFilterChange={(status) =>
                mergeSearch({ status: status === 'ALL' ? undefined : status, page: 1 })
            }
            onSearchChange={(value) => mergeSearch({ search: value || undefined, page: 1 })}
            onResetSearch={() => mergeSearch({ search: undefined, status: undefined, page: 1 })}
            onCreateChurch={(input) => createMutation.mutateAsync(input).then(() => undefined)}
            onUpdateChurch={(id, input) =>
                updateMutation.mutateAsync({ id, input }).then(() => undefined)
            }
            onToggleStatus={(id) => toggleStatusMutation.mutateAsync(id).then(() => undefined)}
            onDeleteChurch={(id) => deleteMutation.mutateAsync(id).then(() => undefined)}
        />
    )
}

