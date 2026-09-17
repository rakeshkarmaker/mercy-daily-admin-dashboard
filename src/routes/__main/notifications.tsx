import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatCard } from '@/components/shared/stat-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Plus, Clock, Send, CalendarIcon, MailOpen, Megaphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DataTableColumn } from '@/components/shared/data-table'
import { getNotifications } from '@/api/notifications'
import type { NotificationCampaign } from '@/api/notifications'

export const Route = createFileRoute('/__main/notifications')({
    component: NotificationsPage,
})

function NotificationsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const filteredData = useMemo(() => {
        const notifications = getNotifications()
        if (!searchQuery.trim()) return notifications
        const query = searchQuery.toLowerCase()
        return notifications.filter((item) => item.title.toLowerCase().includes(query))
    }, [searchQuery])

    const columns: DataTableColumn<NotificationCampaign>[] = useMemo(
        () => [
            { key: 'title', header: 'Title', render: (item) => <span className="text-muted-foreground">{item.title}</span> },
            { key: 'audience', header: 'Audience', render: (item) => <span className="text-muted-foreground">{item.audience}</span> },
            { key: 'date', header: 'Date', render: (item) => <span className="text-muted-foreground">{item.date}</span> },
            { key: 'delivered', header: 'Delivered', render: (item) => <span className="text-muted-foreground">{item.delivered}</span> },
            { key: 'opened', header: 'Opened', render: (item) => <span className="text-muted-foreground">{item.opened}</span> },
        ],
        []
    )

    return (
        <div className="flex flex-col gap-4 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <PageHeader title="Push Notification" description="Manage push notifications" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Delivered" value="8,456" icon={Bell} color="orange" trend={{ value: '+12%', direction: 'up', label: 'vs last month' }} />
                <StatCard label="Opened" value="5,962" icon={MailOpen} color="blue" trend={{ value: '70.5%', direction: 'up', label: 'open rate' }} />
                <StatCard label="Total Campaigns" value="10" icon={Megaphone} color="emerald" trend={{ value: '+3', direction: 'up', label: 'this month' }} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                <SearchInput 
                    value={searchQuery} 
                    onValueChange={setSearchQuery} 
                    placeholder="Search" 
                    className="w-full sm:w-87.5"
                />
                <Button
                    variant="default"
                    onClick={() => setIsCreateOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Notification
                </Button>
            </div>

            {/* Data Table */}
            <div className="mt-2">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    total={filteredData.length}
                    page={1}
                    limit={10}
                    noun="notifications"
                />
            </div>

            {/* Create Notification Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-125 p-0 overflow-hidden bg-dialog-bg border-dialog-border">
                    <DialogHeader className="px-6 py-5 border-b border-dialog-border/70 m-0">
                        <DialogTitle className="text-3xl font-extrabold text-dialog-text">Create Notification</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-6 pt-2 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-dialog-text text-[15px] font-medium">Title</Label>
                            <Input placeholder="Enter notification title" className="bg-transparent border-dialog-border focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 h-11" />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-dialog-text text-[15px] font-medium">Audience</Label>
                            <Select>
                                <SelectTrigger className="bg-transparent border-dialog-border focus:ring-primary/20 h-11 w-full data-placeholder:text-muted-foreground/60 text-base">
                                    <SelectValue placeholder="Select your audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    <SelectItem value="active">Active Users</SelectItem>
                                    <SelectItem value="inactive">Inactive Users</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-dialog-text text-[15px] font-medium">Schedule</Label>
                            <div className="relative">
                                <Input placeholder="mm/dd/yyyy" className="bg-transparent border-dialog-border focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 h-11 pr-10" />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-dialog-text text-[15px] font-medium">Message</Label>
                            <Textarea placeholder="Typing" className="bg-transparent border-dialog-border focus-visible:ring-primary/20 placeholder:text-muted-foreground/60 min-h-30 resize-none text-base" />
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-2">
                            <Button 
                                variant="outline"
                                className="flex-1 h-11 border-dialog-border text-muted-foreground hover:bg-black/5 hover:text-muted-foreground rounded-lg text-base font-medium"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                <Clock className="h-4.5 w-4.5 mr-2" />
                                Schedule
                            </Button>
                            <Button 
                                variant="default"
                                className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-medium shadow-sm"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                <Send className="h-4.5 w-4.5 mr-2" />
                                Send Now
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
