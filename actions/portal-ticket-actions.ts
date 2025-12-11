"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service"
import { z } from "zod"
import { sendEmail } from "@/lib/email-service"
import { ticketCreatedEmail } from "@/lib/email-templates"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { AssistantService } from "@/lib/assistant-service"

const TicketSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
})

export async function createTicket(
    prevState: { success: boolean; error: string | null } | null,
    formData: FormData
): Promise<{ success: boolean; error: string | null; ticketId?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
    }

    const validation = TicketSchema.safeParse(rawData);

    if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || "Validation Error"
        return { success: false, error: errorMessage }
    }

    const { title, description, priority } = validation.data;
    const ticketNumber = 'CN-' + Math.floor(Date.now() / 1000)
    const userId = session.user.id;

    // Early file validation BEFORE creating the ticket
    let validFiles: File[] = [];
    try {
        const files = formData.getAll('images') as File[];
        validFiles = files.filter(f => f.size > 0 && f.name !== 'undefined').slice(0, 10);

        // Validate total file size
        const totalSize = validFiles.reduce((acc, file) => acc + file.size, 0);
        const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

        if (totalSize > MAX_TOTAL_SIZE) {
            console.error(`Total file size ${totalSize} bytes exceeds limit ${MAX_TOTAL_SIZE} bytes`);
            return {
                success: false,
                error: "El tamaño total de los archivos excede el límite de 20MB."
            };
        }

        // Validate file types
        for (const file of validFiles) {
            if (!file.type.startsWith('image/')) {
                console.error(`Invalid file type: ${file.type} for file ${file.name}`);
                return {
                    success: false,
                    error: "Solo se permiten archivos de imagen."
                };
            }
            // Also check individual file size
            if (file.size > 10 * 1024 * 1024) {
                console.error(`File ${file.name} exceeds 10MB limit`);
                return {
                    success: false,
                    error: "Cada archivo no puede exceder 10MB."
                };
            }
        }
    } catch (error) {
        console.error("Error parsing files from FormData:", error);
        return {
            success: false,
            error: "Error al procesar los archivos. Por favor, intenta con archivos más pequeños."
        };
    }

    // Safety check for stale sessions
    const dbUser = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!dbUser) {
        return { success: false, error: "Usuario no inválido. Por favor cierre sesión e ingrese nuevamente." };
    }

    let createdTicketId: string | null = null;

    try {
        const ticket = await prisma.case.create({
            data: {
                title,
                description,
                priority,
                status: 'OPEN',
                ticketNumber,
                userId
            }
        })
        createdTicketId = ticket.id;

        await logActivity(
            AuditAction.CREATE,
            AuditEntity.TICKET,
            ticket.id,
            { title: ticket.title, priority: ticket.priority }
        )

        // Handle Image Uploads (validation already done earlier)
        if (validFiles.length > 0) {
            const uploadDir = join(process.cwd(), "public/uploads");
            await mkdir(uploadDir, { recursive: true });

            for (const file of validFiles) {
                if (file.size > 10 * 1024 * 1024) continue; // Skip single > 10MB
                if (!file.type.startsWith('image/')) continue; // Strict Image check

                try {
                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const path = join(uploadDir, filename);
                    await writeFile(path, buffer);

                    await prisma.attachment.create({
                        data: {
                            name: file.name,
                            url: `/uploads/${filename}`,
                            size: file.size,
                            type: file.type,
                            ticketId: ticket.id,
                            userId: userId
                        }
                    });
                } catch (err) {
                    console.error("Error uploading file:", err);
                }
            }
        }

        if (session.user.email) {
            await sendEmail({
                to: session.user.email,
                subject: `Ticket Received: ${ticket.ticketNumber}`,
                body: ticketCreatedEmail(
                    ticket.id,
                    ticket.ticketNumber,
                    ticket.title,
                    `${process.env.NEXTAUTH_URL}/portal/tickets/${ticket.id}`
                )
            });
        }

        // Trigger Assistant Welcome
        // Fire and forget (don't await to not block UI)
        AssistantService.processTicketCreation(
            ticket.id,
            ticket.ticketNumber,
            session.user.name || 'Usuario',
            ticket.title,
            ticket.description
        ).catch(err => {
            console.error("Assistant Error:", err);
        });

        revalidatePath('/portal/tickets')
    } catch (error) {
        console.error("Failed to create ticket:", error)
        return { success: false, error: "Failed to create ticket. Please try again." }
    }

    if (createdTicketId) {
        redirect(`/portal/tickets/${createdTicketId}`)
    } else {
        redirect('/portal/tickets')
    }
}

export async function closeTicketByClient(ticketId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        // Verificar que el ticket pertenece al usuario
        const ticket = await prisma.case.findUnique({
            where: { id: ticketId },
            include: { user: true }
        });

        if (!ticket || ticket.userId !== session.user.id) {
            return { success: false, error: "No autorizado para cerrar este ticket" };
        }

        // Solo se puede cerrar si está en WAITING_CUSTOMER
        if (ticket.status !== 'WAITING_CUSTOMER') {
            return {
                success: false,
                error: "El ticket debe estar esperando tu respuesta para cerrarlo"
            };
        }

        // Actualizar estado a RESOLVED
        await prisma.case.update({
            where: { id: ticketId },
            data: { status: 'RESOLVED' }
        });

        // Crear mensaje automático de cierre
        const { AssistantService } = await import('@/lib/assistant-service');
        const lau = await AssistantService.getAssistantUser();

        if (lau) {
            await prisma.message.create({
                data: {
                    content: `El ticket ha sido cerrado por el cliente. ✅`,
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
            { action: 'closed_by_client', status: 'RESOLVED' }
        );

        // Obtener configuración del sistema
        const config = await prisma.systemConfig.findFirst();

        // Notificar al equipo
        await sendEmail({
            to: config?.supportEmail || 'support@multicomputos.com',
            subject: `Ticket #${ticket.ticketNumber} cerrado por cliente`,
            body: `El cliente ${ticket.user?.name} cerró el ticket #${ticket.ticketNumber}.\n\nTítulo: ${ticket.title}\n\nVer detalles: ${process.env.NEXTAUTH_URL}/admin/tickets/${ticketId}`
        });

        revalidatePath(`/portal/tickets/${ticketId}`);
        revalidatePath('/portal/tickets');
        revalidatePath('/admin/tickets');
        revalidatePath('/admin');

        return { success: true };
    } catch (error) {
        console.error("Failed to close ticket:", error);
        return { success: false, error: "Error al cerrar el ticket" };
    }
}
