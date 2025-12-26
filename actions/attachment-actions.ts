"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function uploadAttachment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!dbUser) return { error: "Usuario no inválido. Reinicie sesión." };

  const file = formData.get("file") as File;
  const ticketId = formData.get("ticketId") as string;

  if (!file || !ticketId) return { error: "Faltan datos" };

  // Validación
  if (file.size > 10 * 1024 * 1024) return { error: "Archivo excede 10MB" };

  const count = await prisma.attachment.count({ where: { ticketId } });
  if (count >= 10) return { error: "Límite de 10 archivos alcanzado." };

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
