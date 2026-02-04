"use server";

import { prisma } from "@/infrastructure/db/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/core/auth";
import { uploadToCloudinary } from "@/infrastructure/adapters/cloudinary";
import { ErrorCodes } from "@/core/services/error-codes";

export async function uploadAttachment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: ErrorCodes.UNAUTHORIZED };

  // Check vacation
  const { isUserOnVacation } = await import("./vacation-actions");
  const onVacation = await isUserOnVacation(session.user.id);
  if (onVacation) {
    return { error: ErrorCodes.ACTION_BLOCKED_VACATION };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!dbUser) return { error: ErrorCodes.SESSION_EXPIRED };

  const file = formData.get("file") as File;
  const ticketId = formData.get("ticketId") as string;

  if (!file || !ticketId) return { error: "Faltan datos" };

  // Validación
  if (file.size > 10 * 1024 * 1024) return { error: "Archivo excede 10MB" };

  const count = await prisma.attachment.count({ where: { ticketId } });
  if (count >= 10) return { error: ErrorCodes.FILE_LIMIT_REACHED };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, "mc_support_tickets");

    // Registro en BD
    const url = uploadResult.url;

    await prisma.attachment.create({
      data: {
        name: file.name,
        url,
        size: file.size,
        type: file.type || "application/octet-stream",
        ticketId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/portal/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets/${ticketId}`);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Error al subir archivo" };
  }
}
