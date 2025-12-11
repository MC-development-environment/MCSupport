import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { startOfDay, subDays, subWeeks, subMonths, subYears, format } from "date-fns"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const session = await auth();

    // Permissions: Only MANAGER and TEAM_LEAD can download reports
    if (!session?.user?.id || (session.user.role !== 'MANAGER' && session.user.role !== 'TEAM_LEAD')) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';

    let startDate = new Date();
    const endDate = new Date();

    switch (period) {
        case 'daily':
            startDate = startOfDay(new Date());
            break;
        case 'weekly':
            startDate = subWeeks(new Date(), 1);
            break;
        case 'monthly':
            startDate = subMonths(new Date(), 1);
            break;
        case 'yearly':
            startDate = subYears(new Date(), 1);
            break;
        default:
            startDate = subDays(new Date(), 1);
    }

    // Filter by department if Team Lead? 
    // "Líder: Asigna a su departamento". Implies report scope too?
    // User requested "reportes diarios...". Assuming global for Manager, Dept for Lead.
    // I will implement scoped query logic.
    let whereClause: Prisma.CaseWhereInput = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };

    if (session.user.role === 'TEAM_LEAD') {
        const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (currentUser?.departmentId) {
            // Tickets assigned to department members OR reported by department members?
            // Usually "Work done by department". So assignedTo user in department.
            whereClause = {
                ...whereClause,
                assignedTo: {
                    departmentId: currentUser.departmentId
                }
            }
        }
    }

    const tickets = await prisma.case.findMany({
        where: whereClause,
        include: {
            user: true,
            assignedTo: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // Generate CSV
    const headers = ['Ticket ID', 'Title', 'Status', 'Priority', 'Customer', 'Assigned To', 'Created At', 'Updated At'];
    const rows = tickets.map((t) => [
        t.ticketNumber,
        `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
        t.status,
        t.priority,
        t.user.email,
        t.assignedTo?.email || 'Unassigned',
        format(t.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        format(t.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map((r: string[]) => r.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="report-${period}-${format(new Date(), 'yyyyMMdd')}.csv"`
        }
    })
}
