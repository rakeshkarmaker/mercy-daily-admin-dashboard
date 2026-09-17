export type Payment = {
    id: number
    userName: string
    plan: string
    period: string
    amount: string
    method: string
    status: 'Paid' | 'Pending' | 'Failed'
}
