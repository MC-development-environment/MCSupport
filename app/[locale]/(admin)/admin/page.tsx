import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, CreditCard, Users, ArrowUpRight, Smile, AlertCircle, Ticket, Clock } from "lucide-react"
import { getTranslations } from 'next-intl/server';
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/routing';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Prisma } from "@prisma/client"
import { getDashboardStats, formatDuration } from "@/lib/dashboard-stats";

type TicketWithUser = Prisma.CaseGetPayload<{
    include: {
        user: true
    }
}>

import { auth } from "@/auth"

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function AdminPage() {
    const t = await getTranslations('Admin');
    const tEnums = await getTranslations('Enums');

    const session = await auth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    // If not MANAGER, filter by ownership or assignment
    if (session?.user?.role !== 'MANAGER' && session?.user?.id) {
        whereClause = {
            OR: [
                { userId: session.user.id },
                { assignedToId: session.user.id }
            ]
        };
    }

    const [stats, recentTickets] = await Promise.all([
        getDashboardStats(session?.user?.id, session?.user?.role),
        prisma.case.findMany({
            take: 5,
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: true
            }
        })
    ]);

    // Helper for gradients - Subtle style
    const getGradient = (type: string, value: number) => {
        switch (type) {
            case 'total':
                return 'bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card';
            case 'open':
                // Open status is Blue, keeping consistency
                return 'bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card';
            case 'time':
                if (value < 60) return 'bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card';
                if (value < 240) return 'bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card';
                return 'bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card'; // Rose
            case 'sat':
                if (value >= 90) return 'bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card';
                if (value >= 75) return 'bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card';
                return 'bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card'; // Rose
            default:
                return '';
        }
    };

    return (
        <div className="flex flex-col gap-4 md:gap-8">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">{t('dashboard')}</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card x-chunk="dashboard-01-chunk-0" className={getGradient('total', stats.totalTickets)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('totalTickets')}
                        </CardTitle>
                        <Ticket className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTickets}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.ticketGrowth > 0 ? '+' : ''}{stats.ticketGrowth.toFixed(1)}% {t('fromLastMonth')}
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-1" className={getGradient('open', stats.openCases)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('openCases')}
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.openCases}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('active')}
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-2" className={getGradient('time', stats.avgResponseTimeMinutes)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('avgResponseTime')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(stats.avgResponseTimeMinutes)}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('operational')}
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-3" className={getGradient('sat', stats.satisfactionRate)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('customerSat')}</CardTitle>
                        <Smile className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.satisfactionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {t('sysBased')}
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>{t('recentTickets')}</CardTitle>
                            <CardDescription>
                                {t('ticketsDescription')}
                            </CardDescription>
                        </div>
                        <Button asChild size="sm" className="ml-auto gap-1">
                            <Link href="/admin/tickets">
                                {t('viewAll')}
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('ticketTitle')}</TableHead>
                                        <TableHead className="hidden xl:table-column">{t('customer')}</TableHead>
                                        <TableHead className="hidden xl:table-column">{t('status')}</TableHead>
                                        <TableHead className="hidden xl:table-column">{t('date')}</TableHead>
                                        <TableHead className="text-right">{t('priority')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>

                                    {recentTickets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                {t('noRecentTickets')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentTickets.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        <Link href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                                                            {ticket.title}
                                                        </Link>
                                                    </div>
                                                    <div className="hidden text-sm text-muted-foreground md:inline">
                                                        {ticket.user?.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden xl:table-column">
                                                    {ticket.user?.name}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-column">
                                                    <StatusBadge status={ticket.status} />
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                                                    {format(ticket.createdAt, 'yyyy-MM-dd')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end">
                                                        <PriorityBadge priority={ticket.priority} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-5">
                    <CardHeader>
                        <CardTitle>{t('systemHealth')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-8">
                        <div className="flex items-center gap-4">
                            <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">{t('netsuiteApi')}</p>
                                <p className="text-sm text-muted-foreground">{t('operational')}</p>
                            </div>
                            <div className="ml-auto font-medium text-green-500">{t('active')}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
