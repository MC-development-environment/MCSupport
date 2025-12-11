"use client"

import { useState, useEffect, useTransition } from "react"
import { getAnalytics, AnalyticsPeriod } from "@/actions/analytics-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from "recharts"
import { Loader2, TrendingUp, CheckCircle2, AlertCircle, Ticket } from "lucide-react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"
import { CaseStatus } from "@prisma/client"

// Premium Palette Constants
const COLORS = {
    OPEN: '#3b82f6', // Blue-500
    RESOLVED: '#10b981', // Emerald-500
    IN_PROGRESS: '#f59e0b', // Amber-500
    WAITING_CUSTOMER: '#64748b', // Slate-500
    CLOSED: '#8b5cf6', // Violet-500
    DEFAULT: '#94a3b8' // Slate-400
};

interface AnalyticsData {
    summary: {
        total: number;
        open: number;
        resolved: number;
        resolutionRate: number;
    };
    byStatus: { name: string; value: number }[];
    byPriority: { name: string; value: number }[];
    trend: { date: string; tickets: number; resolved: number }[];
    recent: {
        id: string;
        title: string;
        status: CaseStatus;
        createdAt: Date;
        user: {
            name: string | null;
            email: string;
        }
    }[];
}

// Helper to get color by status key
const getChartColor = (status: string) => {
    switch (status) {
        case 'OPEN': return COLORS.OPEN;
        case 'RESOLVED': return COLORS.RESOLVED;
        case 'IN_PROGRESS': return COLORS.IN_PROGRESS;
        case 'WAITING_CUSTOMER': return COLORS.WAITING_CUSTOMER;
        case 'CLOSED': return COLORS.CLOSED;
        default: return COLORS.DEFAULT;
    }
}

// Helper for recent tickets
const getStatusColor = (status: string) => {
    // Matches Premium Palette in StatusBadge
    switch (status) {
        case 'OPEN': return 'bg-blue-500/10 text-blue-700 border-blue-500/20 border whitespace-nowrap shrink-0';
        case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-700 border-amber-500/20 border whitespace-nowrap shrink-0';
        case 'WAITING_CUSTOMER': return 'bg-gray-500/15 text-gray-500 border-gray-500/20 border whitespace-nowrap shrink-0';
        case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 border whitespace-nowrap shrink-0';
        case 'CLOSED': return 'bg-violet-500/10 text-violet-700 border-violet-500/20 border whitespace-nowrap shrink-0';
        default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20 border whitespace-nowrap shrink-0';
    }
};

const getGradient = (type: string, value: number) => {
    switch (type) {
        case 'total':
            return 'bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-transparent';
        case 'open':
            // "Open" State is Blue.
            return 'bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-transparent';
        case 'resolved':
            return 'bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent';
        case 'trend':
            return 'bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent';
        default:
            return '';
    }
};

export function AnalyticsDashboard() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isPending, startTransition] = useTransition();

    const t = useTranslations('Admin.Reports.Analytics');
    const tEnums = useTranslations('Enums');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    useEffect(() => {
        startTransition(async () => {
            const result = await getAnalytics(period);
            if (!result.error) {
                setData(result as AnalyticsData);
            }
        });
    }, [period]);

    if (!data && isPending) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!data) return null;

    const statusData = data.byStatus.map((item) => ({
        name: tEnums(`Status.${item.name}`),
        value: item.value,
        originalName: item.name,
        color: getChartColor(item.name)
    }));

    const priorityData = data.byPriority.map((item) => ({
        name: tEnums(`Priority.${item.name}`),
        value: item.value,
        originalName: item.name
    }));

    return (
        <div className="space-y-4 relative">
            {/* Loading Overlay */}
            {isPending && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg transition-all">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}
            <div className={`space-y-4 transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)} className="w-[400px]">
                        <TabsList>
                            <TabsTrigger value="7d">{t('tabs.7d')}</TabsTrigger>
                            <TabsTrigger value="30d">{t('tabs.30d')}</TabsTrigger>
                            <TabsTrigger value="90d">{t('tabs.90d')}</TabsTrigger>
                            <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className={getGradient('total', data?.summary.total || 0)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalTickets')}</CardTitle>
                            <Ticket className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.total}</div>
                            <p className="text-xs text-muted-foreground">{t('period')}</p>
                        </CardContent>
                    </Card>
                    <Card className={getGradient('open', data?.summary.open || 0)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('openCases')}</CardTitle>
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.open}</div>
                            <p className="text-xs text-muted-foreground">{t('attention')}</p>
                        </CardContent>
                    </Card>
                    <Card className={getGradient('resolved', data?.summary.resolved || 0)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('resolved')}</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.resolved}</div>
                            <p className="text-xs text-muted-foreground">{data.summary.resolutionRate}% {t('resolutionRate')}</p>
                        </CardContent>
                    </Card>
                    <Card className={getGradient('trend', 0)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('trend')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.trend[data.trend.length - 1]?.tickets || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">{t('newToday')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Trend Chart */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>{t('volumeTitle')}</CardTitle>
                            <CardDescription>
                                {t('volumeDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.trend}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: dateLocale })}
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Tooltip
                                            labelFormatter={(label) => format(new Date(label), 'd MMMM yyyy', { locale: dateLocale })}
                                        />
                                        <Area type="monotone" dataKey="tickets" name={t('createdChart')} stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                                        <Area type="monotone" dataKey="resolved" name={t('resolvedChart')} stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
                                        <Legend />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>{t('statusTitle')}</CardTitle>
                            <CardDescription>
                                {t('statusDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Priority Breakdown */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>{t('priorityTitle')}</CardTitle>
                            <CardDescription>{t('priorityDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={priorityData} layout="vertical" margin={{ left: 40 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>{t('recentTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.recent.map((ticket) => (
                                    <div key={ticket.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="grid gap-1">
                                            <p className="font-medium text-sm">{ticket.title}</p>
                                            <p className="text-xs text-muted-foreground">{ticket.user.email} • {format(new Date(ticket.createdAt), 'dd MMM HH:mm', { locale: dateLocale })}</p>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                                            {tEnums(`Status.${ticket.status}`)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
