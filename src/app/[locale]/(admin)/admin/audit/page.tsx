
import { prisma } from "@/infrastructure/db/prisma"
import { AuditLogTimeline } from "@/components/admin/audit-log-timeline"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

import { getTranslations } from 'next-intl/server';

export default async function AuditLogPage() {
    const t = await getTranslations('Admin.TicketDetail');
    // Basic pagination could be added here, currently fetching last 100
    const logs = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
            actor: {
                select: { name: true, email: true }
            }
        }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        System Activity
                    </CardTitle>
                    <CardDescription>
                        Recent system activities for tickets, users, and articles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditLogTimeline logs={logs} emptyText={t('noActivity')} />
                </CardContent>
            </Card>
        </div>
    )
}
