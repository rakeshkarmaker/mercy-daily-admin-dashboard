import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
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

// Mock chart data for Analytical Performance Map
const PERFORMANCE_DATA = [
    { name: 'Jan', userGrowth: 4500, communityActivity: 2000 },
    { name: 'Feb', userGrowth: 4800, communityActivity: 2200 },
    { name: 'Mar', userGrowth: 6000, communityActivity: 3500 },
    { name: 'Apr', userGrowth: 7200, communityActivity: 4500 },
    { name: 'May', userGrowth: 8000, communityActivity: 5000 },
    { name: 'Jun', userGrowth: 8200, communityActivity: 5200 },
    { name: 'Jul', userGrowth: 7500, communityActivity: 4800 },
    { name: 'Aug', userGrowth: 7800, communityActivity: 4600 },
    { name: 'Sep', userGrowth: 7200, communityActivity: 4200 },
    { name: 'Oct', userGrowth: 6500, communityActivity: 4000 },
    { name: 'Nov', userGrowth: 8500, communityActivity: 5500 },
    { name: 'Dec', userGrowth: 10500, communityActivity: 7500 },
]

// Mock pie data
const PIE_DATA = [
    { name: 'Prayers', value: 45, color: 'var(--chart-1)' },
    { name: 'Community', value: 30, color: 'var(--chart-2)' },
    { name: 'Media/Views', value: 25, color: 'var(--chart-4)' },
]

const ACTIVITIES = [
    { id: 1, user: 'Elena Rostova', email: 'Firoz1122@gmail.com', activity: 'Registered a new account', module: 'User Management', date: '12 May 2026', status: 'Active' },
    { id: 2, user: 'Elena Rostova', email: 'Firoz1122@gmail.com', activity: 'Registered a new account', module: 'User Management', date: '12 May 2026', status: 'Delete' },
    { id: 3, user: 'Elena Rostova', email: 'Firoz1122@gmail.com', activity: 'Registered a new account', module: 'User Management', date: '12 May 2026', status: 'Active' },
]

function RouteComponent() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden pb-10">
            {/* Hero Banner */}
            <motion.div
                className="bg-primary rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: motionTokens.duration.fast }}
            >
                {/* Decorative overlay pattern could go here */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
                
                <div className="flex flex-col gap-3 relative z-10">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white uppercase tracking-wider w-fit border border-white/20">
                        DIVINE MANDATE & STEWARDSHIP
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Welcome back, Elizabeth Sterling 👋
                    </h2>
                    <p className="text-white/80 text-sm max-w-2xl mt-1 font-medium">
                        "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
                        <br/><span className="text-white/60 font-semibold">— Isaiah 40:31</span>
                    </p>
                </div>

                <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl p-4 shrink-0 relative z-10 w-full md:w-auto min-w-50">
                    <div className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">TODAY'S SYSTEM DATE</div>
                    <div className="text-2xl font-bold text-white mb-2">July 06, 2026</div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]"></div>
                        <span className="text-success text-xs font-semibold">Server Synced</span>
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
                <StatCard title="TOTAL USERS" value="12,407" change="+12.4%" subtitle="Cumulative signups" />
                <StatCard title="DAILY ACTIVE" value="3,802" change="+8.2%" subtitle="Active today" />
                <StatCard title="PRAYER REQUESTS" value="1,804" change="+15.1%" subtitle="Intercession log" />
                <StatCard title="COMMUNITY POSTS" value="5,603" change="+22.4%" subtitle="Social interactions" />
                <StatCard title="UPCOMING EVENTS" value="3" change="+5.0%" subtitle="Active parishes" />
                <StatCard title="AI QUESTIONS" value="902" change="+35.6%" subtitle="Theological queries" />
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
                                    <CardDescription>Visualizing registered users & community activity metrics</CardDescription>
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
                                    <AreaChart data={PERFORMANCE_DATA} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Average Session</span>
                                    <span className="text-base font-bold text-chart-1">14 min 32s</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Response Rate</span>
                                    <span className="text-base font-bold text-chart-1">98.4%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Server Latency</span>
                                    <span className="text-base font-bold text-success">45ms</span>
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
                            <CardDescription>Where community interactions happen</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center flex-1 p-6 pt-0">
                            <div className="h-50 w-full relative flex items-center justify-center mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={PIE_DATA}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {PIE_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-extrabold text-chart-1">74%</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Rate</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col w-full gap-3 mt-6">
                                {PIE_DATA.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-muted" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm font-semibold text-chart-1">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-muted-foreground">({item.value}%)</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-8 py-3 rounded-lg bg-muted border border-border text-sm font-bold text-chart-1 hover:bg-accent transition-colors">
                                Launch Deep Analytics Interface
                            </button>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Recent Activities Log */}
            <motion.div variants={itemVariants} className="w-full">
                <Card className="border border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold text-chart-1">Recent Activities Logs</CardTitle>
                        <CardDescription>Audit trail of global application interactions</CardDescription>
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
                                {ACTIVITIES.map((act) => (
                                    <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    <img src="/placeholder.jpg" alt={act.user} className="size-full object-cover" />
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
                                            <span className={`font-bold ${act.status === 'Active' ? 'text-success' : 'text-red-500'}`}>
                                                {act.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="p-2 rounded-full bg-orange-50 text-orange-400 hover:bg-orange-100 transition-colors mx-auto block">
                                                <Eye className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
