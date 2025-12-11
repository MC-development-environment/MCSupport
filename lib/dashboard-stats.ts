import { prisma } from "@/lib/prisma"
import { startOfMonth, subMonths, startOfDay, subDays } from "date-fns"
import { unstable_cache } from 'next/cache'

async function calculateDashboardStats(userId?: string, role?: string) {
    // 1. Define Filters based on Role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};
    if (role !== 'MANAGER' && userId) {
        whereClause = {
            OR: [
                { userId: userId },
                { assignedToId: userId }
            ]
        };
    }

    // 2. Total Tickets & Growth
    const totalTickets = await prisma.case.count({ where: whereClause });

    // Growth Calc (This Month vs Last Month)
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    const ticketsThisMonth = await prisma.case.count({
        where: {
            ...whereClause,
            createdAt: { gte: startOfCurrentMonth }
        }
    });

    const ticketsLastMonth = await prisma.case.count({
        where: {
            ...whereClause,
            createdAt: {
                gte: startOfLastMonth,
                lt: startOfCurrentMonth
            }
        }
    });

    let ticketGrowth = 0;
    if (ticketsLastMonth > 0) {
        ticketGrowth = ((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth) * 100;
    } else if (ticketsThisMonth > 0) {
        ticketGrowth = 100; // 100% growth if started from 0
    }

    // 3. Open Cases
    const openCases = await prisma.case.count({
        where: {
            ...whereClause,
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] }
        }
    });

    // Open Cases Growth (vs last month same time approximation - simplified to just count for now or compare change?)
    // For simplicity, keeping open cases growth same as ticket volume trend or 0 for now as 'snapshot'.
    // Let's compare open cases created this month vs closed this month to show "net flow" maybe? 
    // Or just reuse the ticket volume growth for now as a proxy for activity. To be accurate we'd need history snapshots.
    // Let's just use 0 for Open Cases growth explicitly unless we implement snapshots. 
    // Actually, let's compare Open Cases count current vs "Created this month" to show load? 
    // Let's stick to "ticketsThisMonth" vs "ticketsLastMonth" logic for activity.
    // For Open Cases, usually we want to know if backlog is growing. 
    // We'll leave Open Cases growth as null or uncalculated for this iteration to avoid fake data.

    // 4. Avg Response Time (Approximation)
    // We look at tickets created in last 30 days that have messages from NON-Client (assuming support reply)
    // improving this query is complex in Prisma without raw SQL for strict "first reply".
    // We will do a rough check on last 50 tickets.
    const recentTicketsWithMessages = await prisma.case.findMany({
        where: {
            ...whereClause,
            createdAt: { gte: subDays(now, 30) },
            messages: { some: {} } // only if has messages
        },
        select: {
            id: true,
            userId: true,
            createdAt: true,
            messages: {
                select: {
                    senderId: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'asc' },
                take: 5
            }
        },
        take: 50
    });

    let totalResponseMinutes = 0;
    let answeredTicketsCount = 0;

    for (const ticket of recentTicketsWithMessages) {
        // Find first message that is NOT from the ticket creator (and not internal note if we want 'public' response, but internal is also work)
        // Let's count any message not from creator as "response"
        const firstResponse = ticket.messages.find(m => m.senderId !== ticket.userId);
        if (firstResponse) {
            const diffMs = firstResponse.createdAt.getTime() - ticket.createdAt.getTime();
            totalResponseMinutes += diffMs / (1000 * 60);
            answeredTicketsCount++;
        }
    }

    let avgResponseTimeMinutes = 0;
    if (answeredTicketsCount > 0) {
        avgResponseTimeMinutes = Math.round(totalResponseMinutes / answeredTicketsCount);
    }

    // 5. System Health
    // Logic: If any CRITICAL ticket created/updated in last 24h is still OPEN/IN_PROGRESS -> Degraded
    const criticalIssues = await prisma.case.count({
        where: {
            priority: 'CRITICAL',
            status: { in: ['OPEN', 'IN_PROGRESS'] },
        }
    });

    let systemStatus = 'operational'; // 'operational', 'degraded', 'down'
    if (criticalIssues > 0) {
        systemStatus = 'degraded';
    }

    // 6. Customer Sat (reusing page logic)
    const sentimentStats = await prisma.case.groupBy({
        by: ['sentiment'],
        _count: { id: true },
        where: whereClause
    });

    const totalRated = sentimentStats.reduce((acc, curr) => acc + curr._count.id, 0);
    const nonNegative = sentimentStats
        .filter(s => s.sentiment !== 'NEGATIVE')
        .reduce((acc, curr) => acc + curr._count.id, 0);

    let satisfactionRate = 100;
    if (totalRated > 0) {
        satisfactionRate = Math.round((nonNegative / totalRated) * 100);
    }

    return {
        totalTickets,
        ticketGrowth,
        openCases,
        avgResponseTimeMinutes,
        satisfactionRate,
        systemStatus
    };
}

export async function getDashboardStats(userId?: string, role?: string) {
    // Create cache key based on user and role
    const cacheKey = `dashboard-stats-${userId || 'all'}-${role || 'client'}`;

    // Use Next.js unstable_cache for caching
    const getCachedStats = unstable_cache(
        async () => calculateDashboardStats(userId, role),
        [cacheKey],
        {
            revalidate: 300, // 5 minutes
            tags: ['dashboard-stats', `user-${userId || 'all'}`]
        }
    );

    return getCachedStats();
}

export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
