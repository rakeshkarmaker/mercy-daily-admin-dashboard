import { createFileRoute } from '@tanstack/react-router'
import { getSubscriptionPlans } from '@/api/subscriptions'
import { SubscriptionsUI } from '@/components/features/subscriptions/subscriptions-ui'

export const Route = createFileRoute('/__main/subscriptions')({
    component: SubscriptionsPage,
})

function SubscriptionsPage() {
    return <SubscriptionsUI plans={getSubscriptionPlans()} />
}
