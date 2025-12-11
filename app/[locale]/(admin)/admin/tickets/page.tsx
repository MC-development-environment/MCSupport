import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { getTranslations } from 'next-intl/server';
import { StatusBadge } from "@/components/status-badge"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import { TicketFilters } from "@/components/admin/ticket-filters"
import { SortableHeader } from "@/components/sortable-header"

import { PaginationControls } from "@/components/pagination-controls"
import { PriorityBadge } from "@/components/priority-badge"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function TicketsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
        sort?: string;
        order?: string;
    }>;
}) {
    const t = await getTranslations('Admin');
    const session = await auth();
    const params = await searchParams;
    const query = params?.query || '';
    const page = Number(params?.page) || 1;
    const sort = params?.sort || 'createdAt';
    const order = params?.order || 'desc';
    const limit = 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (query) {
        whereClause.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { ticketNumber: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } }
        ];
    }

    // Role restriction
    if (session?.user?.role !== 'MANAGER') {
        const userFilter = {
            OR: [
                { userId: session?.user?.id },
                { assignedToId: session?.user?.id }
            ]
        };

        if (whereClause.OR) {
            whereClause = {
                AND: [
                    whereClause,
                    userFilter
                ]
            };
        } else {
            whereClause = userFilter;
        }
    }

    // Build orderBy based on sort field
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'ticketNumber') orderBy = { ticketNumber: order };
    else if (sort === 'title') orderBy = { title: order };
    else if (sort === 'priority') orderBy = { priority: order };
    else if (sort === 'status') orderBy = { status: order };
    else orderBy = { createdAt: order };

    const [tickets, totalCount] = await Promise.all([
        prisma.case.findMany({
            where: whereClause,
            include: {
                user: true,
                assignedTo: true
            },
            orderBy,
            skip,
            take: limit
        }),
        prisma.case.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <Card x-chunk="dashboard-05-chunk-3">
            <CardHeader className="px-7">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t('tickets')}</CardTitle>
                        <CardDescription>
                            {t('ticketsDescription')}
                        </CardDescription>
                    </div>
                    <TicketFilters />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] whitespace-nowrap">
                                    <SortableHeader column="ticketNumber" label={t('ticketNo')} currentSort={sort} currentOrder={order} />
                                </TableHead>
                                <TableHead className="max-w-[300px]">
                                    <SortableHeader column="title" label={t('ticketTitle')} currentSort={sort} currentOrder={order} />
                                </TableHead>
                                <TableHead className="max-w-[200px]">{t('customer')}</TableHead>
                                <TableHead className="hidden sm:table-cell whitespace-nowrap">
                                    <SortableHeader column="priority" label={t('priority')} currentSort={sort} currentOrder={order} />
                                </TableHead>
                                <TableHead className="whitespace-nowrap">{t('TicketDetail.assignee')}</TableHead>
                                <TableHead className="hidden sm:table-cell whitespace-nowrap">
                                    <SortableHeader column="status" label={t('status')} currentSort={sort} currentOrder={order} />
                                </TableHead>
                                <TableHead className="hidden md:table-cell whitespace-nowrap text-right">
                                    <SortableHeader column="createdAt" label={t('date')} currentSort={sort} currentOrder={order} />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {tickets.map((ticket: any) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <a href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                                            #{ticket.ticketNumber || String(ticket.id).substring(0, 8).toUpperCase()}
                                        </a>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="font-medium truncate" title={ticket.title}>
                                            <a href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                                                {ticket.title}
                                            </a>
                                        </div>
                                        <div className="text-xs text-muted-foreground md:hidden mt-1">
                                            <StatusBadge status={ticket.status} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <div className="space-y-1">
                                            <div className="font-medium truncate" title={ticket.user.name || 'Unknown'}>
                                                {ticket.user.name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate" title={ticket.user.email}>
                                                {ticket.user.email}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <PriorityBadge priority={ticket.priority} />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="text-sm">
                                            {ticket.assignedTo?.name || <span className="text-muted-foreground italic text-xs">{t('TicketDetail.unassigned')}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <StatusBadge status={ticket.status} />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-right whitespace-nowrap text-muted-foreground">
                                        {format(ticket.createdAt, 'yyyy-MM-dd')}
                                        <span className="block text-xs">{format(ticket.createdAt, 'HH:mm')}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        {t('noTickets')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/admin/tickets"
                    totalCount={totalCount}
                    limit={limit}
                />
            </CardContent>
        </Card>
    )
}
