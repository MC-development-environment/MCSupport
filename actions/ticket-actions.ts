"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { sendEmail } from "@/lib/email-service"
import { logger } from "@/lib/logger"
import { statusChangeEmail, assignedEmail } from "@/lib/email-templates"

import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service"

export async function updateTicketStatus(ticketId: string, newStatus: string) {
    const session = await auth();

    try {
        const ticket = await prisma.case.findUnique({
            where: { id: ticketId },
            include: { user: true }
        });

        if (!ticket) return { success: false, error: "Ticket not found" };

        const oldStatus = ticket.status;

        // Validate status enum manually or let Prisma throw
        await prisma.case.update({
            where: { id: ticketId },
            data: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                status: newStatus as any
            }
        })

        await logActivity(
            AuditAction.STATUS_CHANGE,
            AuditEntity.TICKET,
            ticketId,
            { oldStatus, newStatus }
        )

        revalidatePath(`/admin/tickets/${ticketId}`)
        revalidatePath(`/admin/tickets`)
        revalidatePath(`/admin`)

        // Notify Customer with CC
        const { getTicketRecipients } = await import('@/lib/ticket-helpers');
        const recipients = await getTicketRecipients(ticketId);

        if (recipients.to) {
            await sendEmail({
                to: recipients.to,
                cc: recipients.cc,
                subject: `Ticket Update #${ticket.ticketNumber}`,
                body: statusChangeEmail(
                    ticket.ticketNumber,
                    ticket.title,
                    newStatus,
                    `${process.env.NEXTAUTH_URL}/portal/tickets/${ticketId}`,
                    ticketId
                )
            });
        }

        revalidatePath(`/admin/tickets/${ticketId}`)
        revalidatePath(`/admin/tickets`)
        revalidatePath(`/admin`)
        return { success: true }
    } catch (error) {
        logger.error("Failed to update ticket status", { error })
        return { success: false, error: "Failed to update status" }
    }
}

export async function assignTicket(ticketId: string, assigneeId: string) {
    const session = await auth();

    try {
        const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
        if (!assignee) return { success: false, error: "Usuario no encontrado" };

        const ticket = await prisma.case.update({
            where: { id: ticketId },
            data: { assignedToId: assigneeId }
        })

        await logActivity(
            AuditAction.ASSIGN,
            AuditEntity.TICKET,
            ticketId,
            { assignedTo: assignee.email }
        )

        // Notify Assignee
        if (assignee.email) {
            await sendEmail({
                to: assignee.email,
                subject: `Ticket Asignado #${ticket.ticketNumber}`,
                body: assignedEmail(
                    ticket.ticketNumber,
                    ticket.title,
                    `${process.env.NEXTAUTH_URL}/admin/tickets/${ticketId}`
                )
            })
        }

        revalidatePath(`/admin/tickets/${ticketId}`)
        revalidatePath(`/admin/tickets`)
        revalidatePath(`/admin`)
        return { success: true }
    } catch (error) {
        logger.error("Failed to assign ticket", { error })
        return { success: false, error: "Failed to assign ticket" }
    }
}

export async function getMessages(ticketId: string) {
    const messages = await prisma.message.findMany({
        where: { ticketId },
        include: {
            sender: {
                select: { name: true, email: true, role: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    })
    return messages;
}

export async function addMessage(ticketId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    if (!content.trim()) {
        return { success: false, error: "Content cannot be empty" };
    }

    try {
        // Obtener el ticket con información del usuario
        const ticket = await prisma.case.findUnique({
            where: { id: ticketId },
            include: { user: true }
        });

        if (!ticket) {
            return { success: false, error: "Ticket not found" };
        }

        // Crear el mensaje
        await prisma.message.create({
            data: {
                content,
                ticketId,
                senderId: session.user.id,
                isInternal: false // Default to public
            }
        });

        // Determinar si quien escribe es el cliente o el equipo
        const isClient = ticket.userId === session.user.id;

        // 🚀 AUTO-REOPENING: Si el cliente responde y está en WAITING_CUSTOMER
        if (isClient && ticket.status === 'WAITING_CUSTOMER') {
            await prisma.case.update({
                where: { id: ticketId },
                data: { status: 'IN_PROGRESS' }
            });

            // Obtener configuración del sistema
            const config = await prisma.systemConfig.findFirst();

            // Notificar al equipo del cambio
            await sendEmail({
                to: config?.supportEmail || 'support@multicomputos.com',
                subject: `Cliente respondió - Ticket #${ticket.ticketNumber}`,
                body: `El cliente ha respondido al ticket #${ticket.ticketNumber}.\n\nEl estado cambió automáticamente a EN PROGRESO.\n\nVer: ${process.env.NEXTAUTH_URL}/admin/tickets/${ticketId}`
            });

            logger.info(`[Ticket] Auto-reopened ticket ${ticket.ticketNumber} by client response`);
        }

        // Notificar a la otra parte por email
        if (!isClient && ticket.user?.email) {
            // El equipo respondió → notificar al cliente con CC
            const { getTicketRecipients } = await import('@/lib/ticket-helpers');
            const recipients = await getTicketRecipients(ticketId);
            const { newMessageEmail } = await import('@/lib/email-templates');

            if (recipients.to) {
                await sendEmail({
                    to: recipients.to,
                    cc: recipients.cc,
                    subject: `Nuevo mensaje en tu ticket #${ticket.ticketNumber}`,
                    body: newMessageEmail(
                        ticket.ticketNumber,
                        session.user.name || 'Equipo de Soporte',
                        content,
                        `${process.env.NEXTAUTH_URL}/portal/tickets/${ticketId}`
                    )
                });

                logger.info(`[Ticket] Sent new message notification to ${recipients.to} (CC: ${recipients.cc.join(', ')}) for ticket ${ticket.ticketNumber}`);
            }
        }

        revalidatePath(`/portal/tickets/${ticketId}`)
        revalidatePath(`/admin/tickets/${ticketId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add message", error)
        return { success: false, error: "Failed to send message" }
    }
}
