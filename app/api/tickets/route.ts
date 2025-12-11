import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { logActivity, AuditAction, AuditEntity } from '@/lib/audit-service';
import { sendEmail } from '@/lib/email-service';
import { ticketCreatedEmail } from '@/lib/email-templates';
import { AssistantService } from '@/lib/assistant-service';
import { revalidatePath } from 'next/cache';

const TicketSchema = z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();

        const rawData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            priority: formData.get('priority') as string,
        };

        const validation = TicketSchema.safeParse(rawData);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0]?.message || 'Validation Error' },
                { status: 400 }
            );
        }

        const { title, description, priority } = validation.data;
        const ticketNumber = 'CN-' + Math.floor(Date.now() / 1000);
        const userId = session.user.id;

        // Safety check for stale sessions
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!dbUser) {
            return NextResponse.json(
                { success: false, error: "Usuario no válido. Por favor cierre sesión e ingrese nuevamente." },
                { status: 401 }
            );
        }

        // Validate files
        const files = formData.getAll('images') as File[];
        const validFiles = files.filter(f => f.size > 0 && f.name !== 'undefined').slice(0, 10);

        const totalSize = validFiles.reduce((acc, file) => acc + file.size, 0);
        const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

        if (totalSize > MAX_TOTAL_SIZE) {
            console.error(`Total file size ${totalSize} bytes exceeds limit ${MAX_TOTAL_SIZE} bytes`);
            return NextResponse.json(
                { success: false, error: 'El tamaño total de los archivos excede el límite de 20MB.' },
                { status: 400 }
            );
        }

        for (const file of validFiles) {
            if (!file.type.startsWith('image/')) {
                console.error(`Invalid file type: ${file.type} for file ${file.name}`);
                return NextResponse.json(
                    { success: false, error: 'Solo se permiten archivos de imagen.' },
                    { status: 400 }
                );
            }
            if (file.size > 10 * 1024 * 1024) {
                console.error(`File ${file.name} exceeds 10MB individual limit`);
                return NextResponse.json(
                    { success: false, error: 'Cada archivo no puede exceder 10MB.' },
                    { status: 400 }
                );
            }
        }

        // Create ticket
        const ticket = await prisma.case.create({
            data: {
                title,
                description,
                priority,
                status: 'OPEN',
                ticketNumber,
                userId,
            },
        });

        await logActivity(
            AuditAction.CREATE,
            AuditEntity.TICKET,
            ticket.id,
            { title: ticket.title, priority: ticket.priority }
        );

        // Upload files
        if (validFiles.length > 0) {
            const uploadDir = join(process.cwd(), 'public/uploads');
            await mkdir(uploadDir, { recursive: true });

            for (const file of validFiles) {
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
                            userId,
                        },
                    });
                } catch (err) {
                    console.error(`Error uploading file ${file.name}:`, err);
                    // Continue with other files instead of failing completely
                }
            }
        }

        // Send email
        if (session.user.email) {
            await sendEmail({
                to: session.user.email,
                subject: `Ticket Received: ${ticket.ticketNumber}`,
                body: ticketCreatedEmail(
                    ticket.id,
                    ticket.ticketNumber,
                    ticket.title,
                    `${process.env.NEXTAUTH_URL}/portal/tickets/${ticket.id}`
                ),
            });
        }

        // Trigger Assistant (fire and forget)
        AssistantService.processTicketCreation(
            ticket.id,
            ticket.ticketNumber,
            session.user.name || 'Usuario',
            ticket.title,
            ticket.description
        ).catch(err => {
            console.error('Assistant Error:', err);
        });

        revalidatePath('/portal/tickets');

        return NextResponse.json({
            success: true,
            ticketId: ticket.id,
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create ticket. Please try again.' },
            { status: 500 }
        );
    }
}
