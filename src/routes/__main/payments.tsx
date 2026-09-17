import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import * as z from 'zod'
import { useSearchParams } from '@/hooks/use-search-params'
import { PaymentsUI } from '@/components/features/payments/payments-ui'
import { PAYMENTS } from '@/api/payments'

const searchSchema = z.object({
    page: z.number().catch(1).optional(),
    limit: z.number().catch(10).optional(),
    q: z.string().catch('').optional(),
})

export const Route = createFileRoute('/__main/payments')({
    component: PaymentsPage,
    validateSearch: searchSchema,
})

function PaymentsPage() {
    const search = Route.useSearch()
    const mergeSearch = useSearchParams()
    const page = search.page ?? 1
    const limit = search.limit ?? 10
    const searchQuery = search.q ?? ''

    const filteredPayments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return PAYMENTS
        return PAYMENTS.filter((payment) => [payment.userName, payment.plan, payment.amount, payment.method, payment.period, payment.status].some((value) => value.toLowerCase().includes(query)))
    }, [searchQuery])

    const paginatedPayments = useMemo(() => filteredPayments.slice((page - 1) * limit, page * limit), [filteredPayments, page, limit])
    const summary = useMemo(() => ({
        total: filteredPayments.reduce((sum, payment) => sum + (Number.parseFloat(payment.amount.replace(/[^0-9.]/g, '')) || 0), 0),
        paid: filteredPayments.filter((payment) => payment.status === 'Paid').length,
        pending: filteredPayments.filter((payment) => payment.status === 'Pending').length,
        failed: filteredPayments.filter((payment) => payment.status === 'Failed').length,
    }), [filteredPayments])

    return <PaymentsUI payments={paginatedPayments} totalPayments={filteredPayments.length} summary={summary} page={page} limit={limit} searchQuery={searchQuery} onSearchChange={(value) => mergeSearch({ q: value || undefined, page: 1 })} onReset={() => mergeSearch({ q: undefined, page: 1 })} />
}
