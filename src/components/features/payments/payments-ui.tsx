import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import type { DataTableColumn } from '@/components/shared/data-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { AlertCircle, CheckCircle2, Clock3, CreditCard, DollarSign, Eye } from 'lucide-react'
import { StatCardsGrid } from '@/components/shared/stat-card'
import type { Payment } from '@/types/payments'

export function PaymentsUI({ payments, totalPayments, summary, page, limit, searchQuery, onSearchChange, onReset }: {
    payments: Payment[]
    totalPayments: number
    summary: { total: number; paid: number; pending: number; failed: number }
    page: number
    limit: number
    searchQuery: string
    onSearchChange: (value: string) => void
    onReset: () => void
}) {
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

    const columns = useMemo<DataTableColumn<Payment>[]>(() => [
        { key: 'userName', header: 'USER NAME', className: 'font-medium', render: (payment) => <span className="text-muted-foreground">{payment.userName}</span> },
        { key: 'plan', header: 'PLAN', render: (payment) => <span className="text-muted-foreground">{payment.plan}</span> },
        { key: 'amount', header: 'AMOUNT', render: (payment) => <span className="text-muted-foreground">{payment.amount}</span> },
        { key: 'method', header: 'METHOD', render: (payment) => <span className="text-muted-foreground">{payment.method}</span> },
        { key: 'period', header: 'PERIOD', render: (payment) => <span className="text-muted-foreground">{payment.period}</span> },
        {
            key: 'status', header: 'STATUS', render: (payment) => (
                <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                    payment.status === 'Paid' ? 'bg-success/10 text-success' : payment.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                }`}>
                    {payment.status}
                </span>
            ),
        },
        {
            key: 'action', header: 'ACTION', render: (payment) => (
                <Button size="icon" variant="ghost" aria-label={`View payment for ${payment.userName}`} onClick={() => setSelectedPayment(payment)} className="size-8 rounded-full bg-info/10 text-info hover:bg-info/20 hover:text-info">
                    <Eye className="size-4" />
                </Button>
            ),
        },
    ], [])

    return (
        <div className="flex flex-col gap-6 pb-8">
            <StatCardsGrid
                cards={[
                    { label: 'Gross volume', value: `$${summary.total.toFixed(2)}`, icon: DollarSign, color: 'blue' },
                    { label: 'Paid', value: summary.paid, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Pending', value: summary.pending, icon: Clock3, color: 'orange' },
                    { label: 'Failed', value: summary.failed, icon: AlertCircle, color: 'destructive' },
                ]}
            />
            <div className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader title="Payments" description="Review payment activity and transaction status." />
                <SearchInput value={searchQuery} onValueChange={onSearchChange} placeholder="Search payments..." className="w-full sm:max-w-xs" />
            </div>
            <DataTable columns={columns} data={payments} total={totalPayments} page={page} limit={limit} noun="payments" emptyIcon={<CreditCard className="size-6" />} onReset={onReset} />
            <PaymentDetailsDialog payment={selectedPayment} open={selectedPayment !== null} onOpenChange={(open) => !open && setSelectedPayment(null)} />
        </div>
    )
}

function PaymentDetailsDialog({ payment, open, onOpenChange }: { payment: Payment | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!payment) return null
    const total = Number.parseFloat(payment.amount.replace(/[^0-9.]/g, '')) || 0
    const base = Math.floor(total * 0.8)
    const service = total - base

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">Payment reference</p>
                        <p className="font-semibold text-foreground">#PAY-1234{payment.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Detail label="User" value={payment.userName} />
                        <Detail label="Plan" value={payment.plan} />
                        <Detail label="Method" value={payment.method} />
                        <Detail label="Period" value={payment.period} />
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <h3 className="mb-3 font-semibold text-foreground">Bill breakdown</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subscription fee</span><span>${base.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span>${service.toFixed(2)}</span></div>
                            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{payment.amount}</span></div>
                        </div>
                    </div>
                    <Button className="w-full" onClick={() => undefined}>Download invoice</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Detail({ label, value }: { label: string; value: string }) {
    return <div className="rounded-xl border border-border bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>
}
