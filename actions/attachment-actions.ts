"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function uploadAttachment(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) return { error: "Usuario no inválido. Reinicie sesión." };

    const file = formData.get("file") as File;
    const ticketId = formData.get("ticketId") as string;

    if (!file || !ticketId) return { error: "Faltan datos" };

    // Validation
    if (file.size > 5 * 1024 * 1024) return { error: "Archivo excede 5MB" };

    const count = await prisma.attachment.count({ where: { ticketId } });
    if (count >= 10) return { error: "Límite de 10 archivos alcanzado." };

    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory
        const uploadDir = join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        // DB Record
        const url = `/uploads/${filename}`;

        await prisma.attachment.create({
            data: {
                name: file.name,
                url,
                size: file.size,
                type: file.type || 'application/octet-stream',
                ticketId,
                userId: session.user.id
            }
        });

        revalidatePath(`/portal/tickets/${ticketId}`);
        revalidatePath(`/admin/tickets/${ticketId}`);

        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Error al subir archivo" };
    }
}
