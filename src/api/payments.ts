import type { Payment } from '@/types/payments'

export type { Payment } from '@/types/payments'

export const PAYMENTS: Payment[] = [
    { id: 1, userName: 'Jane Cooper', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Stripe', status: 'Paid' },
    { id: 2, userName: 'Wade Warren', plan: 'Premium Yearly', period: 'Annual', amount: '$39.99', method: 'Card', status: 'Paid' },
    { id: 3, userName: 'Esther Howard', plan: 'Community Event Ticket', period: 'One-off', amount: '$15', method: 'Apple Pay', status: 'Paid' },
    { id: 4, userName: 'Leslie Alexander', plan: 'Premium Yearly', period: 'Annual', amount: '$39.99', method: 'Stripe', status: 'Paid' },
    { id: 5, userName: 'Jenny Wilson', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Stripe', status: 'Paid' },
    { id: 6, userName: 'Guy Hawkins', plan: 'Donation', period: 'One-off', amount: '$160', method: 'Stripe', status: 'Pending' },
    { id: 7, userName: 'Robert Fox', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Card', status: 'Pending' },
    { id: 8, userName: 'Kristin Watson', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Card', status: 'Failed' },
    { id: 9, userName: 'Jacob Jones', plan: 'Premium Yearly', period: 'Annual', amount: '$39.99', method: 'Card', status: 'Paid' },
    { id: 10, userName: 'Bessie Cooper', plan: 'Community Event Ticket', period: 'One-off', amount: '$15', method: 'Card', status: 'Paid' },
    { id: 11, userName: 'Albert Flores', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Card', status: 'Paid' },
    { id: 12, userName: 'Dianne Russell', plan: 'Premium Yearly', period: 'Annual', amount: '$39.99', method: 'Card', status: 'Failed' },
    { id: 13, userName: 'Eleanor Pena', plan: 'Premium Monthly', period: 'Monthly', amount: '$4.99', method: 'Card', status: 'Failed' },
]

export function getPaymentById(id: number): Payment | undefined {
    return PAYMENTS.find((p) => p.id === id)
}
