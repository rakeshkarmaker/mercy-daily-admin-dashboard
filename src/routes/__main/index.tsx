import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Eye, Loader2, AlertCircle } from 'lucide-react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    Pie,
    PieChart,
    Cell
} from 'recharts'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { motionTokens } from '@/lib/motionTokens'
import { getOverview } from '@/api/overview'

const containerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.05 }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth } }
}

export const Route = createFileRoute('/__main/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { data: overview, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard-overview'],
        queryFn: getOverview,
        staleTime: 30_000,
    })

    const currentUser = useMemo(() => {
        try {
            const raw = localStorage.getItem('auth_user')
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    }, [])

    const adminName = currentUser?.name || 'Administrator'

    const pieData = useMemo(() => {
        if (!overview) return []
        return [
            { name: 'Prayers', value: overview.engagementDistribution.prayers, count: overview.engagementDistribution.prayersCount, color: 'var(--chart-1)' },
            { name: 'Community', value: overview.engagementDistribution.community, count: overview.engagementDistribution.communityCount, color: 'var(--chart-2)' },
            { name: 'Media/Views', value: overview.engagementDistribution.mediaViews, count: overview.engagementDistribution.mediaViewsCount, color: 'var(--chart-4)' },
        ]
    }, [overview])

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-full pb-10">
                <div className="bg-primary/90 rounded-2xl p-8 flex justify-between items-center h-48 animate-pulse">
                    <div className="space-y-3">
                        <div className="h-4 w-40 bg-white/20 rounded-full"></div>
                        <div className="h-8 w-72 bg-white/30 rounded-lg"></div>
                        <div className="h-4 w-96 bg-white/20 rounded"></div>
                    </div>
                    <div className="h-20 w-44 bg-white/10 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-muted/40 rounded-xl animate-pulse"></div>
                    <div className="h-80 bg-muted/40 rounded-xl animate-pulse"></div>
                </div>
            </div>
        )
    }

    if (error || !overview) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-destructive/20 rounded-2xl bg-destructive/5 my-6">
                <AlertCircle className="size-10 text-destructive mb-3" />
                <h3 className="text-lg font-bold text-destructive">Failed to Load Dashboard Data</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Could not retrieve live metrics from the backend service. Ensure the backend server is running.
                </p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                    <Loader2 className="size-4 animate-spin" />
                    Retry Connection
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden pb-10">
            {/* Hero Banner */}
            <motion.div
                className="bg-primary rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: motionTokens.duration.fast }}
            >
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
                
                <div className="flex flex-col gap-3 relative z-10">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white uppercase tracking-wider w-fit border border-white/20">
                        DIVINE MANDATE & STEWARDSHIP
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Welcome back, {adminName} 👋
                    </h2>
                    <p className="text-white/90 text-sm max-w-2xl mt-1 font-medium leading-relaxed">
                        &quot;{overview.verseOfTheDay.verse}&quot;
                        <br/><span className="text-white/70 font-semibold">— {overview.verseOfTheDay.reference}</span>
                    </p>
                </div>

                <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl p-4 shrink-0 relative z-10 w-full md:w-auto min-w-50">
                    <div className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">TODAY&apos;S SYSTEM DATE</div>
                    <div className="text-2xl font-bold text-white mb-2">{overview.systemDate}</div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]"></div>
                        <span className="text-success text-xs font-semibold">Live Database Synced</span>
                    </div>
                </div>
            </motion.div>

            {/* Stat Cards Row */}
            <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <StatCard title="TOTAL USERS" value={overview.stats.totalUsers.toLocaleString()} change={overview.stats.totalUsersChange} subtitle="Registered accounts" />
                <StatCard title="DAILY ACTIVE" value={overview.stats.dailyActive.toLocaleString()} change={overview.stats.dailyActiveChange} subtitle="Active users" />
                <StatCard title="PRAYER REQUESTS" value={overview.stats.prayerRequests.toLocaleString()} change={overview.stats.prayerRequestsChange} subtitle="Intercession log" />
                <StatCard title="COMMUNITY POSTS" value={overview.stats.communityPosts.toLocaleString()} change={overview.stats.communityPostsChange} subtitle="Live publications" />
                <StatCard title="UPCOMING EVENTS" value={overview.stats.upcomingEvents.toLocaleString()} change={overview.stats.upcomingEventsChange} subtitle="Active parishes" />
                <StatCard title="AI QUESTIONS" value={overview.stats.aiQuestions.toLocaleString()} change={overview.stats.aiQuestionsChange} subtitle="Theological queries" />
            </motion.div>

            {/* Charts Section */}
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Line Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="border border-border/50 shadow-sm h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle className="text-lg font-bold text-chart-1">Analytical Performance Map</CardTitle>
                                    <CardDescription>Live database trajectory of registered users & community activity</CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                                        <span className="text-muted-foreground">User Growth</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                                        <span className="text-muted-foreground">Community Activity</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                            <div className="h-62.5 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={overview.performanceData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <Tooltip cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                        <Area type="monotone" dataKey="userGrowth" stroke="var(--chart-1)" strokeWidth={3} fillOpacity={1} fill="url(#colorUser)" />
                                        <Area type="monotone" dataKey="communityActivity" stroke="var(--chart-2)" strokeWidth={3} fillOpacity={1} fill="url(#colorComm)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Stats Footer */}
                            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Registered</span>
                                    <span className="text-base font-bold text-chart-1">{overview.stats.totalUsers} users</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Rate</span>
                                    <span className="text-base font-bold text-chart-1">{overview.engagementDistribution.totalRate}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Database Status</span>
                                    <span className="text-base font-bold text-success">Healthy / Online</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Donut Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="border border-border/50 shadow-sm h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold text-chart-1">Engagement Distribution</CardTitle>
                            <CardDescription>Live breakdown across active modules</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center flex-1 p-6 pt-0">
                            <div className="h-50 w-full relative flex items-center justify-center mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-extrabold text-chart-1">{overview.engagementDistribution.totalRate}%</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Rate</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col w-full gap-3 mt-6">
                                {pieData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-muted" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm font-semibold text-chart-1">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-muted-foreground">({item.count.toLocaleString()} · {item.value}%)</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Recent Activities Log */}
            <motion.div variants={itemVariants} className="w-full">
                <Card className="border border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-chart-1">Recent Activities Logs</CardTitle>
                        <CardDescription>Real database activity feed from verified users</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-sm">USER</th>
                                    <th className="px-6 py-4">ACTIVITY</th>
                                    <th className="px-6 py-4">MODULE</th>
                                    <th className="px-6 py-4">DATE & TIME</th>
                                    <th className="px-6 py-4">STATUS</th>
                                    <th className="px-6 py-4 rounded-tr-sm text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 bg-card">
                                {overview.recentActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No recent activity logs recorded in the database.
                                        </td>
                                    </tr>
                                ) : (
                                    overview.recentActivities.map((act) => (
                                        <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                                                        {act.user.slice(0, 2)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-chart-1">{act.user}</span>
                                                        <span className="text-xs text-muted-foreground">{act.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-foreground">{act.activity}</td>
                                            <td className="px-6 py-4 text-muted-foreground font-medium">{act.module}</td>
                                            <td className="px-6 py-4 font-semibold text-chart-1">{act.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${act.status === 'Active' ? 'text-success' : 'text-destructive'}`}>
                                                    {act.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors mx-auto block" title="Inspect">
                                                    <Eye className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}

function StatCard({ title, value, change, subtitle }: { title: string, value: string, change: string, subtitle: string }) {
    return (
        <motion.div variants={itemVariants}>
            <Card className="border border-border/50 shadow-sm h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
                        <span className="text-2xl font-extrabold text-chart-1">{value}</span>
                    </div>
                    
                    <div className="flex flex-col items-start gap-1">
                        <div className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                            {change}
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{subtitle}</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
