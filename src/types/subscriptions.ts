export type SubscriptionPlan = {
    id: string
    name: string
    price: string
    priceColor: string
    description: string
    features: string[]
    isActive: boolean
    actionType: 'switch' | 'edit'
}
