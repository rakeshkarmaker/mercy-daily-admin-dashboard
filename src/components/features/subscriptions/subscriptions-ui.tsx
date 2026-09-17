import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { CircleCheck, Edit, Plus } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/subscriptions'

export function SubscriptionsUI({ plans }: { plans: SubscriptionPlan[] }) {
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Subscription Management" description="Manage plans, pricing, and subscriber access." />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {plans.map((plan, index) => (
                    <Card key={plan.id} className={`flex flex-col border-border transition-shadow hover:shadow-md ${index === 1 ? 'border-primary/40 ring-1 ring-primary/20 shadow-md' : ''}`}>
                        {index === 1 && <div className="rounded-t-xl border-b border-primary/20 bg-primary/10 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-primary">Most popular</div>}
                        <CardHeader className={index === 1 ? 'pt-4' : undefined}>
                            <CardTitle className="text-lg font-medium text-foreground">{plan.name}</CardTitle>
                            <div className="mt-2 mb-1 text-4xl font-bold text-primary">{plan.price}</div>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-6 flex-1">
                            <ul className="space-y-4">
                                {plan.features.map((feature) => <li key={feature} className="flex items-center gap-3"><CircleCheck className="size-5 shrink-0 text-success" /><span className="text-sm font-medium">{feature}</span></li>)}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-6">
                            {plan.isActive ? <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                            {plan.actionType === 'switch' ? <Switch checked={plan.isActive} aria-label={`Toggle ${plan.name}`} /> : <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setEditingPlan(plan)}><Edit className="mr-2 size-4" />Edit</Button>}
                        </CardFooter>
                    </Card>
                ))}
            </div>
            <PlanDialog plan={editingPlan} open={editingPlan !== null} onOpenChange={(open) => !open && setEditingPlan(null)} />
        </div>
    )
}

function PlanDialog({ plan, open, onOpenChange }: { plan: SubscriptionPlan | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!plan) return null
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Edit plan</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="plan-title">Title</Label><Input id="plan-title" defaultValue={plan.name} /></div>
                    <div className="space-y-2"><Label htmlFor="plan-price">Monthly price</Label><Input id="plan-price" defaultValue={plan.price.replace(/[^0-9.]/g, '')} /></div>
                    <div className="space-y-2"><Label htmlFor="plan-feature">Add feature</Label><div className="flex gap-3"><Input id="plan-feature" placeholder="Enter a feature" /><Button variant="outline" aria-label="Add feature"><Plus className="size-4" /></Button></div></div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"><span className="text-sm text-muted-foreground">Status</span><Switch defaultChecked={plan.isActive} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onOpenChange(false)}>Save plan</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
