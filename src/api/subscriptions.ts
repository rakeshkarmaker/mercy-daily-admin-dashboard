import type { SubscriptionPlan } from '@/types/subscriptions'

export type { SubscriptionPlan } from '@/types/subscriptions'

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Basic',
        price: 'Free',
        priceColor: 'text-primary',
        description: 'Basic access to get started',
        features: ['Basic daily content', 'Prayer request logs', 'Standard analytics'],
        isActive: true,
        actionType: 'switch',
    },
    {
        id: 'premium-monthly-1',
        name: 'Premium Monthly',
        price: '$4.99/mo',
        priceColor: 'text-orange-500',
        description: 'Full access, billed monthly',
        features: ['Unlimited AI questions', 'Advanced trend analysis', 'Priority Support'],
        isActive: true,
        actionType: 'edit',
    },
    {
        id: 'premium-yearly',
        name: 'Premium Yearly',
        price: '$39.99/yr',
        priceColor: 'text-brand',
        description: 'Full access, billed yearly',
        features: ['Everything in Monthly', 'Exclusive community guides', 'Offline content access'],
        isActive: true,
        actionType: 'edit',
    }
]

export function getSubscriptionPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS
}
