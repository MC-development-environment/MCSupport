"use server"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { subDays, format, eachDayOfInterval } from "date-fns"

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export async function getAnalytics(period: AnalyticsPeriod = '7d') {
    const session = await auth();
    // RBAC: Manager/TeamLead/Admin
    if (!session?.user?.id) return { error: "Unauthorized" };

    let startDate = subDays(new Date(), 7);
    if (period === '30d') startDate = subDays(new Date(), 30);
    if (period === '90d') startDate = subDays(new Date(), 90);
    if (period === 'all') startDate = new Date(0); // Epoch

    const whereClause: Prisma.CaseWhereInput = {
        createdAt: { gte: startDate }
    };

    if (session.user.role !== 'MANAGER') {
        whereClause.OR = [
            { userId: session.user.id },
            { assignedToId: session.user.id }
        ];
    }

    // Scoping for Team Lead could be added here, but "Sophisticated" usually implies Global overview for now unless specified.
    // I'll keep global for simplicity of "High Level Report".

    const [
        totalTickets,
        openTickets,
        resolvedTickets,
        ticketsByStatus,
        ticketsByPriority,
        recentTickets
    ] = await Promise.all([
        prisma.case.count({ where: whereClause }),
        prisma.case.count({ where: { ...whereClause, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } } }),
        prisma.case.count({ where: { ...whereClause, status: { in: ['RESOLVED', 'CLOSED'] } } }),
        prisma.case.groupBy({
            by: ['status'],
            where: whereClause,
            _count: { id: true }
        }),
        prisma.case.groupBy({
            by: ['priority'],
            where: whereClause,
            _count: { id: true }
        }),
        prisma.case.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { name: true, email: true } } }
        })
    ]);

    // Trend Data (Tickets per day)
    // Prisma doesn't support easy "group by day" raw query without raw SQL or tedious processing.
    // Efficient way: Fetch createdAts (lightweight) and aggregate in JS, or use raw query.
    // For < 10k tickets, JS agg is fine.
    const allTicketsDates = await prisma.case.findMany({
        where: whereClause,
        select: { createdAt: true, status: true }
    });

    const trendMap = new Map<string, { total: number, resolved: number }>();

    // Initialize map with all days in range (to avoid gaps)
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    days.forEach(day => {
        trendMap.set(format(day, 'yyyy-MM-dd'), { total: 0, resolved: 0 });
    });

    allTicketsDates.forEach((t) => {
        const key = format(t.createdAt, 'yyyy-MM-dd');
        if (trendMap.has(key)) {
            const entry = trendMap.get(key)!;
            entry.total++;
            if (['RESOLVED', 'CLOSED'].includes(t.status)) {
                entry.resolved++;
            }
        }
    });

    const trendData = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        tickets: data.total,
        resolved: data.resolved
    }));

    return {
        summary: {
            total: totalTickets,
            open: openTickets,
            resolved: resolvedTickets,
            resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0
        },
        byStatus: ticketsByStatus.map((g) => ({ name: g.status, value: g._count.id })),
        byPriority: ticketsByPriority.map((g) => ({ name: g.priority, value: g._count.id })),
        trend: trendData,
        recent: recentTickets
    };
}
