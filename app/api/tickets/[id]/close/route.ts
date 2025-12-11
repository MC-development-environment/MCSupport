import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { AssistantService } from '@/lib/assistant-service';
import { sendEmail } from '@/lib/email-service';
import { logActivity, AuditAction, AuditEntity } from '@/lib/audit-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.redirect(
            new URL('/auth/signin?callbackUrl=' + encodeURIComponent(request.url), request.url)
        );
    }

    const { id: ticketId } = await params;

    try {
        const ticket = await prisma.case.findUnique({
            where: { id: ticketId },
            include: { user: true }
        });

        if (!ticket || ticket.userId !== session.user.id) {
            return NextResponse.redirect(
                new URL('/portal/tickets?error=unauthorized', request.url)
            );
        }

        if (ticket.status !== 'WAITING_CUSTOMER') {
            return NextResponse.redirect(
                new URL(`/portal/tickets/${ticketId}?error=invalid-status`, request.url)
            );
        }

        // Cerrar ticket
        await prisma.case.update({
            where: { id: ticketId },
            data: { status: 'RESOLVED' }
        });

        // Crear mensaje automático
        const lau = await AssistantService.getAssistantUser();
        if (lau) {
            await prisma.message.create({
                data: {
                    content: `El ticket ha sido cerrado por el cliente vía email. ✅`,
                    ticketId,
                    senderId: lau.id,
                    isInternal: false
                }
            });
        }

        // Registrar actividad
        await logActivity(
            AuditAction.UPDATE,
            AuditEntity.TICKET,
            ticketId,
            { action: 'closed_by_client_email', status: 'RESOLVED' }
        );

        // Obtener configuración
        const config = await prisma.systemConfig.findFirst();

        // Notificar al equipo
        await sendEmail({
            to: config?.supportEmail || 'support@multicomputos.com',
            subject: `Ticket #${ticket.ticketNumber} cerrado por cliente (vía email)`,
            body: `El cliente ${ticket.user?.name} cerró el ticket #${ticket.ticketNumber} desde el email.\n\nTítulo: ${ticket.title}\n\nVer: ${process.env.NEXTAUTH_URL}/admin/tickets/${ticketId}`
        });

        // Redirigir al ticket con mensaje de éxito
        return NextResponse.redirect(
            new URL(`/portal/tickets/${ticketId}?success=closed`, request.url)
        );
    } catch (error) {
        console.error("Error closing ticket from email:", error);
        return NextResponse.redirect(
            new URL(`/portal/tickets?error=failed`, request.url)
        );
    }
}
