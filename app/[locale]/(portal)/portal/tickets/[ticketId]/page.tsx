import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ChevronLeft, Home } from "lucide-react"
import { Button } from '@/components/ui/button';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { TicketConversation } from "@/components/portal/ticket-conversation";
import { AttachmentSection } from "@/components/attachments/attachment-section"; // Reusing admin component
import { getMessages } from "@/actions/ticket-actions";
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

interface Props {
    params: Promise<{
        ticketId: string
        locale: string
    }>
}

export async function generateMetadata({ params }: Props) {
    const t = await getTranslations('Portal.TicketDetail');
    const resolvedParams = await params;
    const ticket = await prisma.case.findUnique({
        where: { id: resolvedParams.ticketId },
        select: { title: true, ticketNumber: true }
    })

    if (!ticket) {
        return {
            title: `${t('notFound')} - MCSupport`
        }
    }

    return {
        title: `Ticket #${ticket.ticketNumber || '...'} - ${ticket.title} - MCSupport`
    }
}

export default async function PortalTicketDetailPage({ params }: Props) {
    const t = await getTranslations('Portal.TicketDetail');
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/api/auth/signin?callbackUrl=/portal/tickets')
    }

    const resolvedParams = await params;
    const { ticketId, locale } = resolvedParams;

    const ticket = await prisma.case.findUnique({
        where: { id: ticketId },
        include: {
            attachments: {
                orderBy: { createdAt: 'desc' },
                include: {
                    uploader: {
                        select: { name: true, email: true }
                    }
                }
            }
        }
    })

    if (!ticket) {
        notFound();
    }

    // Security Check: Ensure user owns the ticket
    if (ticket.userId !== session.user.id) {
        return <div>{t('permissionDenied')}</div>
    }

    const dateLocale = locale === 'es' ? es : enUS;

    // Fetch Messages
    const messages = await getMessages(ticketId)

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" className="pl-0 gap-2">
                        <Link href="/portal/tickets">
                            <ChevronLeft className="h-4 w-4" />
                            {t('back')}
                        </Link>
                    </Button>
                </div>
                <StatusBadge status={ticket.status} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{ticket.title}</CardTitle>
                            <CardDescription>
                                Ticket #{ticket.ticketNumber} • {format(ticket.createdAt, "PPP", { locale: dateLocale })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                <p className="whitespace-pre-wrap">{ticket.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Close Ticket Button - Only show when waiting for customer */}
                    {ticket.status === 'WAITING_CUSTOMER' && (
                        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                            <CardHeader>
                                <CardTitle className="text-base text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    {t('problemResolved')}
                                </CardTitle>
                                <CardDescription className="text-blue-700 dark:text-blue-300">
                                    {t('closeTicketDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={async () => {
                                    'use server';
                                    const { closeTicketByClient } = await import('@/actions/portal-ticket-actions');
                                    await closeTicketByClient(ticket.id);
                                }}>
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        ✅ {t('closeTicket')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <TicketConversation
                        ticketId={ticket.id}
                        initialMessages={messages as any}
                        userEmail={session.user.email}
                    />
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{t('details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-muted-foreground text-xs font-medium">{t('priority')}</span>
                                <div className="mt-1">
                                    <PriorityBadge priority={ticket.priority} />
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground text-xs font-medium">{t('created')}</span>
                                <div className="mt-1 text-sm">
                                    {format(ticket.createdAt, "PPP p", { locale: dateLocale })}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground text-xs font-medium">{t('lastUpdated')}</span>
                                <div className="mt-1 text-sm">
                                    {format(ticket.updatedAt, "PPP p", { locale: dateLocale })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <AttachmentSection ticketId={ticket.id} attachments={ticket.attachments} />
                </div>
            </div>
        </div>
    )
}
